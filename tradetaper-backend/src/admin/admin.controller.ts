import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Delete,
  Body,
  UnauthorizedException,
  UseGuards,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  Res,
  HttpCode,
  HttpStatus,
  Inject,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { TestUserSeedService } from '../seed/test-user-seed.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';
import {
  AuthRateLimit,
  RateLimitGuard,
} from '../common/guards/rate-limit.guard';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Request, Response, CookieOptions } from 'express';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';
import { compare } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import QRCode from 'qrcode';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminVerifyMfaDto } from './dto/admin-verify-mfa.dto';
import { AdminMfaBootstrapStartDto } from './dto/admin-mfa-bootstrap-start.dto';
import { AdminMfaBootstrapCompleteDto } from './dto/admin-mfa-bootstrap-complete.dto';
import { AdminRegenerateRecoveryCodesDto } from './dto/admin-regenerate-recovery-codes.dto';
import { AdminMfaCredential } from './entities/admin-mfa-credential.entity';
import {
  AdminAuthAuditLog,
  AdminAuthAuditOutcome,
} from './entities/admin-auth-audit-log.entity';

interface AdminMfaChallengeState {
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  attempts: number;
}

interface AdminMfaBootstrapState {
  email: string;
  secretBase32: string;
  ipAddress: string | null;
  userAgent: string | null;
  attempts: number;
}

interface AdminAuditContext {
  adminEmail?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

@Controller('admin')
@UseGuards(AdminGuard, RateLimitGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly testUserSeedService: TestUserSeedService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(AdminMfaCredential)
    private readonly adminMfaCredentialRepository: Repository<AdminMfaCredential>,
    @InjectRepository(AdminAuthAuditLog)
    private readonly adminAuthAuditLogRepository: Repository<AdminAuthAuditLog>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private resolveCookieDomain(): string | undefined {
    const configuredCookieDomain =
      this.configService.get<string>('ADMIN_COOKIE_DOMAIN') ||
      this.configService.get<string>('AUTH_COOKIE_DOMAIN');
    if (configuredCookieDomain) {
      return configuredCookieDomain;
    }

    const frontendUrl =
      this.configService.get<string>('ADMIN_FRONTEND_URL') ||
      this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      return undefined;
    }

    try {
      const hostname = new URL(frontendUrl).hostname.toLowerCase();
      if (hostname === 'localhost' || /^[\d.]+$/.test(hostname)) {
        return undefined;
      }
      const hostParts = hostname.split('.');
      if (hostParts.length < 2) {
        return undefined;
      }
      return `.${hostParts.slice(-2).join('.')}`;
    } catch {
      return undefined;
    }
  }

  private getAdminCookieOptions(): CookieOptions {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const configuredMaxAge = Number(
      this.configService.get<string>('ADMIN_COOKIE_MAX_AGE_MS'),
    );
    const maxAge =
      Number.isFinite(configuredMaxAge) && configuredMaxAge > 0
        ? configuredMaxAge
        : 8 * 60 * 60 * 1000;

    const options: CookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    };

    const domain = this.resolveCookieDomain();
    if (domain) {
      options.domain = domain;
    }
    return options;
  }

  private setAdminCookie(res: Response, token: string): void {
    res.cookie('admin_token', token, this.getAdminCookieOptions());
  }

  private clearAdminCookie(res: Response): void {
    const options = this.getAdminCookieOptions();
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: options.secure,
      sameSite: options.sameSite,
      path: options.path,
      domain: options.domain,
    });
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  private async isValidAdminPassword(password: string): Promise<boolean> {
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    if (adminPasswordHash) {
      try {
        return await compare(password, adminPasswordHash);
      } catch (error) {
        this.logger.error(
          `Failed to validate ADMIN_PASSWORD_HASH: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
        return false;
      }
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return false;
    }

    this.logger.warn(
      'ADMIN_PASSWORD is being used for admin auth. Configure ADMIN_PASSWORD_HASH for production hardening.',
    );
    return this.safeEqual(password, adminPassword);
  }

  private parseBooleanEnv(value: string | undefined): boolean | null {
    if (typeof value !== 'string') {
      return null;
    }
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false;
    }
    return null;
  }

  private resolveAdminJwtSecret(): string {
    const adminJwtSecret =
      this.configService.get<string>('ADMIN_JWT_SECRET') ||
      this.configService.get<string>('JWT_SECRET');
    if (!adminJwtSecret) {
      throw new InternalServerErrorException(
        'Admin authentication is not configured',
      );
    }
    return adminJwtSecret;
  }

  private normalizeAdminEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private getConfiguredAdminEmail(): string | null {
    const configured = this.configService.get<string>('ADMIN_EMAIL')?.trim();
    if (!configured) {
      return null;
    }
    return this.normalizeAdminEmail(configured);
  }

  private isAdminMfaRequired(): boolean {
    const explicitRequirement = this.parseBooleanEnv(
      this.configService.get<string>('ADMIN_REQUIRE_MFA'),
    );
    if (explicitRequirement !== null) {
      return explicitRequirement;
    }
    return true;
  }

  private resolveAdminMfaIssuer(): string {
    return (
      this.configService.get<string>('ADMIN_MFA_ISSUER')?.trim() ||
      'TradeTaper Admin'
    );
  }

  private resolveAdminMfaBootstrapTtlMs(): number {
    const configuredMs = Number(
      this.configService.get<string>('ADMIN_MFA_BOOTSTRAP_TTL_MS'),
    );
    if (Number.isFinite(configuredMs) && configuredMs >= 60_000) {
      return configuredMs;
    }

    const configuredSeconds = Number(
      this.configService.get<string>('ADMIN_MFA_BOOTSTRAP_TTL_SECONDS'),
    );
    if (Number.isFinite(configuredSeconds) && configuredSeconds >= 60) {
      return configuredSeconds * 1000;
    }

    return 10 * 60 * 1000;
  }

  private resolveAdminMfaStepSeconds(): number {
    const configured = Number(
      this.configService.get<string>('ADMIN_MFA_TOTP_STEP_SECONDS'),
    );
    if (Number.isFinite(configured) && configured >= 15 && configured <= 120) {
      return configured;
    }
    return 30;
  }

  private resolveAdminMfaWindowSteps(): number {
    const configured = Number(
      this.configService.get<string>('ADMIN_MFA_TOTP_WINDOW_STEPS'),
    );
    if (Number.isFinite(configured) && configured >= 0 && configured <= 5) {
      return configured;
    }
    return 1;
  }

  private resolveAdminMfaChallengeTtlMs(): number {
    const configuredMs = Number(
      this.configService.get<string>('ADMIN_MFA_CHALLENGE_TTL_MS'),
    );
    if (Number.isFinite(configuredMs) && configuredMs >= 30_000) {
      return configuredMs;
    }

    const configuredSeconds = Number(
      this.configService.get<string>('ADMIN_MFA_CHALLENGE_TTL_SECONDS'),
    );
    if (Number.isFinite(configuredSeconds) && configuredSeconds >= 30) {
      return configuredSeconds * 1000;
    }

    return 5 * 60 * 1000;
  }

  private resolveAdminMfaChallengeMaxAttempts(): number {
    const configured = Number(
      this.configService.get<string>('ADMIN_MFA_CHALLENGE_MAX_ATTEMPTS'),
    );
    if (Number.isFinite(configured) && configured >= 1 && configured <= 10) {
      return configured;
    }
    return 5;
  }

  private resolveAdminMfaBootstrapMaxAttempts(): number {
    const configured = Number(
      this.configService.get<string>('ADMIN_MFA_BOOTSTRAP_MAX_ATTEMPTS'),
    );
    if (Number.isFinite(configured) && configured >= 1 && configured <= 10) {
      return configured;
    }
    return 5;
  }

  private resolveAdminRecoveryCodeCount(): number {
    const configured = Number(
      this.configService.get<string>('ADMIN_MFA_RECOVERY_CODES_COUNT'),
    );
    if (Number.isFinite(configured) && configured >= 4 && configured <= 20) {
      return configured;
    }
    return 10;
  }

  private getRequestIpAddress(req: Request): string | null {
    const candidate = req.ip || req.socket?.remoteAddress;
    if (!candidate) {
      return null;
    }
    return candidate.slice(0, 64);
  }

  private getRequestUserAgent(req: Request): string | null {
    const userAgentHeader = req.headers['user-agent'];
    if (typeof userAgentHeader !== 'string') {
      return null;
    }
    return userAgentHeader.slice(0, 255);
  }

  private getRequestId(req: Request): string | null {
    const headerValue =
      req.headers['x-request-id'] || req.headers['x-correlation-id'];
    if (typeof headerValue !== 'string') {
      return null;
    }
    return headerValue.slice(0, 128);
  }

  private getChallengeCacheKey(challengeId: string): string {
    return `admin:mfa:challenge:${challengeId}`;
  }

  private getBootstrapCacheKey(bootstrapId: string): string {
    return `admin:mfa:bootstrap:${bootstrapId}`;
  }

  private hasMatchingChallengeFingerprint(
    challenge:
      | AdminMfaChallengeState
      | AdminMfaBootstrapState,
    req: Request,
  ): boolean {
    const ipAddress = this.getRequestIpAddress(req);
    const userAgent = this.getRequestUserAgent(req);

    if (challenge.ipAddress && !ipAddress) {
      return false;
    }
    if (challenge.userAgent && !userAgent) {
      return false;
    }
    if (challenge.ipAddress && ipAddress && !this.safeEqual(challenge.ipAddress, ipAddress)) {
      return false;
    }
    if (challenge.userAgent && userAgent && !this.safeEqual(challenge.userAgent, userAgent)) {
      return false;
    }
    return true;
  }

  private encodeBase32Secret(input: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (const byte of input) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private decodeBase32Secret(secret: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const normalized = secret.toUpperCase().replace(/\s+/g, '').replace(/=+$/, '');
    if (!normalized) {
      throw new InternalServerErrorException(
        'ADMIN_MFA_TOTP_SECRET is empty after base32 normalization',
      );
    }

    const bytes: number[] = [];
    let bitBuffer = 0;
    let bitLength = 0;

    for (const char of normalized) {
      const value = alphabet.indexOf(char);
      if (value === -1) {
        throw new InternalServerErrorException(
          'ADMIN_MFA_TOTP_SECRET is not valid base32',
        );
      }
      bitBuffer = (bitBuffer << 5) | value;
      bitLength += 5;
      if (bitLength >= 8) {
        bitLength -= 8;
        bytes.push((bitBuffer >> bitLength) & 0xff);
      }
    }

    return Buffer.from(bytes);
  }

  private generateBase32Secret(length: number = 20): string {
    return this.encodeBase32Secret(randomBytes(length));
  }

  private resolveMfaEncryptionKey(): Buffer {
    const configured = this.configService
      .get<string>('ADMIN_MFA_ENCRYPTION_KEY')
      ?.trim();
    if (!configured) {
      throw new InternalServerErrorException(
        'ADMIN_MFA_ENCRYPTION_KEY must be configured for admin MFA',
      );
    }

    const maybeHex =
      configured.length % 2 === 0 && /^[0-9a-f]+$/i.test(configured)
        ? Buffer.from(configured, 'hex')
        : null;
    if (maybeHex && maybeHex.length >= 32) {
      return maybeHex.subarray(0, 32);
    }

    const maybeBase64 = Buffer.from(configured, 'base64');
    if (maybeBase64.length >= 32 && maybeBase64.toString('base64') === configured) {
      return maybeBase64.subarray(0, 32);
    }

    return createHash('sha256').update(configured, 'utf8').digest();
  }

  private resolveRecoveryCodePepper(): Buffer {
    const configured = this.configService
      .get<string>('ADMIN_MFA_RECOVERY_CODE_PEPPER')
      ?.trim();
    if (configured) {
      return createHash('sha256').update(configured, 'utf8').digest();
    }
    return this.resolveMfaEncryptionKey();
  }

  private encryptMfaSecret(secretBase32: string): {
    ciphertext: string;
    ivHex: string;
    authTagHex: string;
  } {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.resolveMfaEncryptionKey(), iv);
    const ciphertext = Buffer.concat([
      cipher.update(secretBase32, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return {
      ciphertext: ciphertext.toString('base64'),
      ivHex: iv.toString('hex'),
      authTagHex: authTag.toString('hex'),
    };
  }

  private decryptMfaSecret(credential: AdminMfaCredential): string {
    try {
      const iv = Buffer.from(credential.totpSecretIv, 'hex');
      const authTag = Buffer.from(credential.totpSecretAuthTag, 'hex');
      const encrypted = Buffer.from(credential.totpSecretEncrypted, 'base64');
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.resolveMfaEncryptionKey(),
        iv,
      );
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
        'utf8',
      );
    } catch {
      throw new InternalServerErrorException(
        'Failed to decrypt admin MFA secret',
      );
    }
  }

  private hashRecoveryCode(adminEmail: string, recoveryCode: string): string {
    const normalizedCode = recoveryCode
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 16);
    return createHmac('sha256', this.resolveRecoveryCodePepper())
      .update(`${this.normalizeAdminEmail(adminEmail)}:${normalizedCode}`)
      .digest('hex');
  }

  private generateRecoveryCodes(): string[] {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codeCount = this.resolveAdminRecoveryCodeCount();
    const generated = new Set<string>();
    while (generated.size < codeCount) {
      const raw = randomBytes(8);
      let value = '';
      for (const byte of raw) {
        value += alphabet[byte % alphabet.length];
      }
      generated.add(`${value.slice(0, 4)}-${value.slice(4, 8)}`);
    }
    return [...generated];
  }

  private async getAdminMfaCredential(
    adminEmail: string,
  ): Promise<AdminMfaCredential | null> {
    return this.adminMfaCredentialRepository.findOne({
      where: { adminEmail: this.normalizeAdminEmail(adminEmail) },
    });
  }

  private async getResolvedMfaSecretForAdmin(
    adminEmail: string,
  ): Promise<{
    secret: Buffer;
    source: 'credential' | 'legacy-env';
    credential: AdminMfaCredential | null;
  } | null> {
    const normalizedEmail = this.normalizeAdminEmail(adminEmail);
    const credential = await this.getAdminMfaCredential(normalizedEmail);
    if (credential?.enabled) {
      const secretBase32 = this.decryptMfaSecret(credential);
      return {
        secret: this.decodeBase32Secret(secretBase32),
        source: 'credential',
        credential,
      };
    }

    const legacySecret = this.configService
      .get<string>('ADMIN_MFA_TOTP_SECRET')
      ?.trim();
    if (!legacySecret) {
      return null;
    }
    const treatAsBase32 =
      this.parseBooleanEnv(
        this.configService.get<string>('ADMIN_MFA_TOTP_SECRET_BASE32'),
      ) ?? true;
    return {
      secret: treatAsBase32
        ? this.decodeBase32Secret(legacySecret)
        : Buffer.from(legacySecret, 'utf8'),
      source: 'legacy-env',
      credential: null,
    };
  }

  private async upsertAdminMfaCredential(
    adminEmail: string,
    secretBase32: string,
    recoveryCodes: string[],
  ): Promise<AdminMfaCredential> {
    const normalizedEmail = this.normalizeAdminEmail(adminEmail);
    const encryptedSecret = this.encryptMfaSecret(secretBase32);
    const recoveryCodeHashes = recoveryCodes.map((code) =>
      this.hashRecoveryCode(normalizedEmail, code),
    );
    const now = new Date();

    const existing = await this.getAdminMfaCredential(normalizedEmail);
    if (existing) {
      existing.totpSecretEncrypted = encryptedSecret.ciphertext;
      existing.totpSecretIv = encryptedSecret.ivHex;
      existing.totpSecretAuthTag = encryptedSecret.authTagHex;
      existing.recoveryCodeHashes = recoveryCodeHashes;
      existing.enabled = true;
      existing.enrolledAt = now;
      existing.recoveryCodesGeneratedAt = now;
      existing.lastVerifiedAt = now;
      return this.adminMfaCredentialRepository.save(existing);
    }

    return this.adminMfaCredentialRepository.save(
      this.adminMfaCredentialRepository.create({
        adminEmail: normalizedEmail,
        totpSecretEncrypted: encryptedSecret.ciphertext,
        totpSecretIv: encryptedSecret.ivHex,
        totpSecretAuthTag: encryptedSecret.authTagHex,
        recoveryCodeHashes,
        enabled: true,
        enrolledAt: now,
        recoveryCodesGeneratedAt: now,
        lastVerifiedAt: now,
      }),
    );
  }

  private generateTotpCode(secret: Buffer, counter: number): string {
    const counterBuffer = Buffer.alloc(8);
    const high = Math.floor(counter / 0x100000000);
    const low = counter >>> 0;
    counterBuffer.writeUInt32BE(high, 0);
    counterBuffer.writeUInt32BE(low, 4);

    const digest = createHmac('sha1', secret).update(counterBuffer).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);
    return (binary % 1_000_000).toString().padStart(6, '0');
  }

  private isValidTotpCode(secret: Buffer, otpCode: string): boolean {
    const normalizedCode = otpCode.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(normalizedCode)) {
      return false;
    }

    const stepSeconds = this.resolveAdminMfaStepSeconds();
    const windowSteps = this.resolveAdminMfaWindowSteps();
    const currentCounter = Math.floor(Date.now() / 1000 / stepSeconds);

    for (let offset = -windowSteps; offset <= windowSteps; offset += 1) {
      const expectedCode = this.generateTotpCode(
        secret,
        currentCounter + offset,
      );
      if (this.safeEqual(expectedCode, normalizedCode)) {
        return true;
      }
    }

    return false;
  }

  private signAdminAccessToken(email: string, mfaVerified: boolean): string {
    const normalizedEmail = email.trim().toLowerCase();
    const payload = {
      sub: `admin:${normalizedEmail}`,
      email: normalizedEmail,
      role: 'admin',
      mfa: mfaVerified,
      amr: mfaVerified ? ['pwd', 'otp'] : ['pwd'],
    };
    return this.jwtService.sign(payload);
  }

  private signAdminMfaBootstrapToken(
    email: string,
    bootstrapId: string,
    expiresInSeconds: number,
  ): string {
    const normalizedEmail = this.normalizeAdminEmail(email);
    return this.jwtService.sign(
      {
        sub: `admin:${normalizedEmail}`,
        email: normalizedEmail,
        role: 'admin',
        type: 'admin-mfa-bootstrap',
        jti: bootstrapId,
      },
      {
        expiresIn: expiresInSeconds,
      },
    );
  }

  private signAdminMfaChallengeToken(
    email: string,
    challengeId: string,
    expiresInSeconds: number,
  ): string {
    const normalizedEmail = email.trim().toLowerCase();
    return this.jwtService.sign(
      {
        sub: `admin:${normalizedEmail}`,
        email: normalizedEmail,
        role: 'admin',
        type: 'admin-mfa-challenge',
        jti: challengeId,
      },
      {
        expiresIn: expiresInSeconds,
      },
    );
  }

  private async issueAdminMfaBootstrap(
    email: string,
    secretBase32: string,
    req: Request,
  ): Promise<string> {
    const bootstrapId = uuidv4();
    const bootstrapTtlMs = this.resolveAdminMfaBootstrapTtlMs();
    const bootstrapState: AdminMfaBootstrapState = {
      email: this.normalizeAdminEmail(email),
      secretBase32,
      ipAddress: this.getRequestIpAddress(req),
      userAgent: this.getRequestUserAgent(req),
      attempts: 0,
    };

    await this.cacheManager.set(
      this.getBootstrapCacheKey(bootstrapId),
      bootstrapState,
      bootstrapTtlMs,
    );

    return this.signAdminMfaBootstrapToken(
      email,
      bootstrapId,
      Math.ceil(bootstrapTtlMs / 1000),
    );
  }

  private async issueAdminMfaChallenge(
    email: string,
    req: Request,
  ): Promise<string> {
    const challengeId = uuidv4();
    const challengeTtlMs = this.resolveAdminMfaChallengeTtlMs();
    const challengeState: AdminMfaChallengeState = {
      email: email.trim().toLowerCase(),
      ipAddress: this.getRequestIpAddress(req),
      userAgent: this.getRequestUserAgent(req),
      attempts: 0,
    };

    await this.cacheManager.set(
      this.getChallengeCacheKey(challengeId),
      challengeState,
      challengeTtlMs,
    );

    return this.signAdminMfaChallengeToken(
      email,
      challengeId,
      Math.ceil(challengeTtlMs / 1000),
    );
  }

  private async clearAdminMfaBootstrap(bootstrapId: string): Promise<void> {
    await this.cacheManager.del(this.getBootstrapCacheKey(bootstrapId));
  }

  private async clearAdminMfaChallenge(challengeId: string): Promise<void> {
    await this.cacheManager.del(this.getChallengeCacheKey(challengeId));
  }

  private async loadAdminMfaBootstrap(
    bootstrapId: string,
  ): Promise<AdminMfaBootstrapState | null> {
    const challenge = await this.cacheManager.get<AdminMfaBootstrapState>(
      this.getBootstrapCacheKey(bootstrapId),
    );
    if (!challenge) {
      return null;
    }
    return challenge;
  }

  private async loadAdminMfaChallenge(
    challengeId: string,
  ): Promise<AdminMfaChallengeState | null> {
    const challenge = await this.cacheManager.get<AdminMfaChallengeState>(
      this.getChallengeCacheKey(challengeId),
    );
    if (!challenge) {
      return null;
    }
    return challenge;
  }

  private verifyAdminMfaBootstrapToken(bootstrapToken: string): {
    email: string;
    bootstrapId: string;
  } {
    let payload: {
      sub: string;
      email: string;
      role?: string;
      type?: string;
      jti?: string;
    };
    try {
      payload = this.jwtService.verify(bootstrapToken, {
        secret: this.resolveAdminJwtSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA bootstrap token');
    }

    if (
      payload.type !== 'admin-mfa-bootstrap' ||
      payload.role !== 'admin' ||
      !payload.email ||
      !payload.sub?.startsWith('admin:') ||
      !payload.jti
    ) {
      throw new UnauthorizedException('Invalid MFA bootstrap token');
    }

    return { email: payload.email.toLowerCase(), bootstrapId: payload.jti };
  }

  private verifyAdminMfaChallengeToken(challengeToken: string): {
    email: string;
    challengeId: string;
  } {
    let payload: {
      sub: string;
      email: string;
      role?: string;
      type?: string;
      jti?: string;
    };
    try {
      payload = this.jwtService.verify(challengeToken, {
        secret: this.resolveAdminJwtSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA challenge');
    }

    if (
      payload.type !== 'admin-mfa-challenge' ||
      payload.role !== 'admin' ||
      !payload.email ||
      !payload.sub?.startsWith('admin:') ||
      !payload.jti
    ) {
      throw new UnauthorizedException('Invalid MFA challenge');
    }

    return { email: payload.email.toLowerCase(), challengeId: payload.jti };
  }

  private async logAdminAuthAudit(
    req: Request,
    eventType: string,
    outcome: AdminAuthAuditOutcome,
    context: AdminAuditContext = {},
  ): Promise<void> {
    try {
      await this.adminAuthAuditLogRepository.save(
        this.adminAuthAuditLogRepository.create({
          eventType,
          outcome,
          adminEmail: context.adminEmail
            ? this.normalizeAdminEmail(context.adminEmail)
            : null,
          ipAddress: this.getRequestIpAddress(req),
          userAgent: this.getRequestUserAgent(req),
          requestId: this.getRequestId(req),
          reason: context.reason || null,
          metadata: context.metadata || null,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to persist admin auth audit log for ${eventType}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async buildEnrollmentPayload(
    adminEmail: string,
    req: Request,
  ): Promise<{
    bootstrapToken: string;
    otpauthUrl: string;
    manualEntryKey: string;
    qrCodeDataUrl: string;
  }> {
    const normalizedEmail = this.normalizeAdminEmail(adminEmail);
    const secretBase32 = this.generateBase32Secret();
    const stepSeconds = this.resolveAdminMfaStepSeconds();
    const issuer = this.resolveAdminMfaIssuer();
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(
      `${issuer}:${normalizedEmail}`,
    )}?secret=${secretBase32}&issuer=${encodeURIComponent(
      issuer,
    )}&algorithm=SHA1&digits=6&period=${stepSeconds}`;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 280,
    });
    const bootstrapToken = await this.issueAdminMfaBootstrap(
      normalizedEmail,
      secretBase32,
      req,
    );
    return {
      bootstrapToken,
      otpauthUrl,
      manualEntryKey: secretBase32,
      qrCodeDataUrl,
    };
  }

  private async verifyRecoveryCodeForCredential(
    credential: AdminMfaCredential,
    recoveryCode: string,
    consumeCode: boolean,
  ): Promise<boolean> {
    const codeHash = this.hashRecoveryCode(credential.adminEmail, recoveryCode);
    const index = credential.recoveryCodeHashes.findIndex(
      (storedHash) =>
        storedHash.length === codeHash.length && this.safeEqual(storedHash, codeHash),
    );
    if (index === -1) {
      return false;
    }
    if (consumeCode) {
      credential.recoveryCodeHashes = credential.recoveryCodeHashes.filter(
        (_hash, storedIndex) => storedIndex !== index,
      );
      credential.lastRecoveryCodeUsedAt = new Date();
      credential.lastVerifiedAt = new Date();
      await this.adminMfaCredentialRepository.save(credential);
    }
    return true;
  }

  private requireOtpOrRecoveryCode(
    otpCode?: string,
    recoveryCode?: string,
  ): 'otp' | 'recovery' {
    if (otpCode && recoveryCode) {
      throw new BadRequestException(
        'Provide either otpCode or recoveryCode, not both',
      );
    }
    if (!otpCode && !recoveryCode) {
      throw new BadRequestException('otpCode or recoveryCode is required');
    }
    return recoveryCode ? 'recovery' : 'otp';
  }

  // ─── Admin Auth ─────────────────────────────────────────────────────────
  @Public()
  @Post('auth/login')
  @AuthRateLimit()
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() body: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const configuredAdminEmail = this.getConfiguredAdminEmail();
    if (
      !configuredAdminEmail ||
      (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH)
    ) {
      await this.logAdminAuthAudit(req, 'login', 'failure', {
        reason: 'credentials-not-configured',
      });
      throw new InternalServerErrorException(
        'Admin credentials are not configured',
      );
    }

    const normalizedRequestEmail = this.normalizeAdminEmail(body.email);
    const isEmailValid = this.safeEqual(
      normalizedRequestEmail,
      configuredAdminEmail,
    );
    const isPasswordValid = await this.isValidAdminPassword(body.password);
    if (!isEmailValid || !isPasswordValid) {
      await this.logAdminAuthAudit(req, 'login', 'failure', {
        adminEmail: normalizedRequestEmail,
        reason: 'invalid-credentials',
      });
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const mfaRequired = this.isAdminMfaRequired();
    if (mfaRequired) {
      const resolvedSecret = await this.getResolvedMfaSecretForAdmin(
        normalizedRequestEmail,
      );

      if (!resolvedSecret) {
        const enrollment = await this.buildEnrollmentPayload(
          normalizedRequestEmail,
          req,
        );
        await this.logAdminAuthAudit(req, 'mfa-enrollment-required', 'success', {
          adminEmail: normalizedRequestEmail,
        });
        return {
          mfaEnrollmentRequired: true,
          challengeMethod: 'totp',
          recoveryCodesCount: this.resolveAdminRecoveryCodeCount(),
          ...enrollment,
        };
      }

      if (body.otpCode) {
        if (!this.isValidTotpCode(resolvedSecret.secret, body.otpCode)) {
          await this.logAdminAuthAudit(req, 'login-mfa-inline', 'failure', {
            adminEmail: normalizedRequestEmail,
            reason: 'invalid-otp',
          });
          throw new UnauthorizedException('Invalid MFA code');
        }

        if (resolvedSecret.credential) {
          resolvedSecret.credential.lastVerifiedAt = new Date();
          await this.adminMfaCredentialRepository.save(resolvedSecret.credential);
        }

        const token = this.signAdminAccessToken(normalizedRequestEmail, true);
        this.setAdminCookie(res, token);
        await this.logAdminAuthAudit(req, 'login', 'success', {
          adminEmail: normalizedRequestEmail,
          metadata: { mfaMethod: 'otp', inline: true },
        });
        return {
          access_token: token,
          role: 'admin',
          mfaVerified: true,
          mfaMethod: 'otp',
        };
      }

      const challengeToken = await this.issueAdminMfaChallenge(
        normalizedRequestEmail,
        req,
      );
      await this.logAdminAuthAudit(req, 'mfa-challenge-issued', 'success', {
        adminEmail: normalizedRequestEmail,
        metadata: { source: resolvedSecret.source },
      });

      return {
        mfaRequired: true,
        challengeMethod: 'totp_or_recovery',
        challengeToken,
      };
    }

    const token = this.signAdminAccessToken(normalizedRequestEmail, false);
    this.setAdminCookie(res, token);
    await this.logAdminAuthAudit(req, 'login', 'success', {
      adminEmail: normalizedRequestEmail,
      metadata: { mfa: false },
    });
    return { access_token: token, role: 'admin' };
  }

  @Public()
  @Post('auth/mfa/bootstrap/start')
  @AuthRateLimit()
  @HttpCode(HttpStatus.OK)
  async startAdminMfaBootstrap(
    @Body() body: AdminMfaBootstrapStartDto,
    @Req() req: Request,
  ) {
    const configuredAdminEmail = this.getConfiguredAdminEmail();
    if (
      !configuredAdminEmail ||
      (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH)
    ) {
      await this.logAdminAuthAudit(req, 'mfa-bootstrap-start', 'failure', {
        reason: 'credentials-not-configured',
      });
      throw new InternalServerErrorException(
        'Admin credentials are not configured',
      );
    }
    if (!this.isAdminMfaRequired()) {
      throw new BadRequestException(
        'Admin MFA is not required. Enable ADMIN_REQUIRE_MFA to bootstrap.',
      );
    }

    const normalizedRequestEmail = this.normalizeAdminEmail(body.email);
    const isEmailValid = this.safeEqual(
      normalizedRequestEmail,
      configuredAdminEmail,
    );
    const isPasswordValid = await this.isValidAdminPassword(body.password);
    if (!isEmailValid || !isPasswordValid) {
      await this.logAdminAuthAudit(req, 'mfa-bootstrap-start', 'failure', {
        adminEmail: normalizedRequestEmail,
        reason: 'invalid-credentials',
      });
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const currentMfaSecret = await this.getResolvedMfaSecretForAdmin(
      normalizedRequestEmail,
    );
    if (currentMfaSecret) {
      throw new ForbiddenException('Admin MFA is already configured');
    }

    const enrollment = await this.buildEnrollmentPayload(normalizedRequestEmail, req);
    await this.logAdminAuthAudit(req, 'mfa-bootstrap-start', 'success', {
      adminEmail: normalizedRequestEmail,
    });
    return {
      mfaEnrollmentRequired: true,
      recoveryCodesCount: this.resolveAdminRecoveryCodeCount(),
      ...enrollment,
    };
  }

  @Public()
  @Post('auth/mfa/bootstrap/complete')
  @AuthRateLimit()
  @HttpCode(HttpStatus.OK)
  async completeAdminMfaBootstrap(
    @Body() body: AdminMfaBootstrapCompleteDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const bootstrap = this.verifyAdminMfaBootstrapToken(body.bootstrapToken);
    const bootstrapState = await this.loadAdminMfaBootstrap(bootstrap.bootstrapId);
    if (!bootstrapState) {
      await this.logAdminAuthAudit(req, 'mfa-bootstrap-complete', 'failure', {
        adminEmail: bootstrap.email,
        reason: 'bootstrap-expired',
      });
      throw new UnauthorizedException(
        'MFA bootstrap has expired. Start enrollment again.',
      );
    }
    if (!this.safeEqual(bootstrapState.email, bootstrap.email)) {
      await this.clearAdminMfaBootstrap(bootstrap.bootstrapId);
      await this.logAdminAuthAudit(req, 'mfa-bootstrap-complete', 'failure', {
        adminEmail: bootstrap.email,
        reason: 'bootstrap-email-mismatch',
      });
      throw new UnauthorizedException('Invalid MFA bootstrap');
    }
    if (!this.hasMatchingChallengeFingerprint(bootstrapState, req)) {
      await this.clearAdminMfaBootstrap(bootstrap.bootstrapId);
      await this.logAdminAuthAudit(req, 'mfa-bootstrap-complete', 'failure', {
        adminEmail: bootstrap.email,
        reason: 'bootstrap-context-mismatch',
      });
      throw new UnauthorizedException('MFA bootstrap context mismatch');
    }

    const bootstrapSecret = this.decodeBase32Secret(bootstrapState.secretBase32);
    if (!this.isValidTotpCode(bootstrapSecret, body.otpCode)) {
      const nextAttempts = bootstrapState.attempts + 1;
      if (nextAttempts >= this.resolveAdminMfaBootstrapMaxAttempts()) {
        await this.clearAdminMfaBootstrap(bootstrap.bootstrapId);
        await this.logAdminAuthAudit(req, 'mfa-bootstrap-complete', 'failure', {
          adminEmail: bootstrap.email,
          reason: 'bootstrap-max-attempts-exceeded',
        });
        throw new UnauthorizedException(
          'Invalid MFA code. Start enrollment again.',
        );
      }
      await this.cacheManager.set(
        this.getBootstrapCacheKey(bootstrap.bootstrapId),
        {
          ...bootstrapState,
          attempts: nextAttempts,
        },
        this.resolveAdminMfaBootstrapTtlMs(),
      );
      await this.logAdminAuthAudit(req, 'mfa-bootstrap-complete', 'failure', {
        adminEmail: bootstrap.email,
        reason: 'invalid-otp',
      });
      throw new UnauthorizedException('Invalid MFA code');
    }

    const recoveryCodes = this.generateRecoveryCodes();
    await this.upsertAdminMfaCredential(
      bootstrap.email,
      bootstrapState.secretBase32,
      recoveryCodes,
    );
    await this.clearAdminMfaBootstrap(bootstrap.bootstrapId);

    const token = this.signAdminAccessToken(bootstrap.email, true);
    this.setAdminCookie(res, token);
    await this.logAdminAuthAudit(req, 'mfa-bootstrap-complete', 'success', {
      adminEmail: bootstrap.email,
      metadata: { recoveryCodeCount: recoveryCodes.length },
    });
    return {
      access_token: token,
      role: 'admin',
      mfaVerified: true,
      mfaEnrolled: true,
      recoveryCodes,
      recoveryCodesRemaining: recoveryCodes.length,
    };
  }

  @Public()
  @Post('auth/verify-mfa')
  @AuthRateLimit()
  @HttpCode(HttpStatus.OK)
  async verifyAdminMfa(
    @Body() body: AdminVerifyMfaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const verificationMode = this.requireOtpOrRecoveryCode(
      body.otpCode,
      body.recoveryCode,
    );

    const challenge = this.verifyAdminMfaChallengeToken(body.challengeToken);
    const challengeState = await this.loadAdminMfaChallenge(challenge.challengeId);
    if (!challengeState) {
      await this.logAdminAuthAudit(req, 'mfa-verify', 'failure', {
        adminEmail: challenge.email,
        reason: 'challenge-expired',
      });
      throw new UnauthorizedException(
        'MFA challenge has expired. Please sign in again.',
      );
    }
    if (!this.safeEqual(challengeState.email, challenge.email)) {
      await this.clearAdminMfaChallenge(challenge.challengeId);
      await this.logAdminAuthAudit(req, 'mfa-verify', 'failure', {
        adminEmail: challenge.email,
        reason: 'challenge-email-mismatch',
      });
      throw new UnauthorizedException('Invalid MFA challenge');
    }
    if (!this.hasMatchingChallengeFingerprint(challengeState, req)) {
      await this.clearAdminMfaChallenge(challenge.challengeId);
      await this.logAdminAuthAudit(req, 'mfa-verify', 'failure', {
        adminEmail: challenge.email,
        reason: 'challenge-context-mismatch',
      });
      throw new UnauthorizedException('MFA challenge context mismatch');
    }

    const resolvedSecret = await this.getResolvedMfaSecretForAdmin(challenge.email);
    if (!resolvedSecret) {
      await this.clearAdminMfaChallenge(challenge.challengeId);
      await this.logAdminAuthAudit(req, 'mfa-verify', 'failure', {
        adminEmail: challenge.email,
        reason: 'mfa-not-configured',
      });
      throw new UnauthorizedException('Admin MFA is not configured');
    }

    let credential = resolvedSecret.credential;
    const registerMfaFailure = async (reason: string): Promise<never> => {
      const nextAttempts = challengeState.attempts + 1;
      if (nextAttempts >= this.resolveAdminMfaChallengeMaxAttempts()) {
        await this.clearAdminMfaChallenge(challenge.challengeId);
        await this.logAdminAuthAudit(req, 'mfa-verify', 'failure', {
          adminEmail: challenge.email,
          reason: `${reason}-max-attempts`,
        });
        throw new UnauthorizedException(
          'Invalid MFA code. Please sign in again.',
        );
      }
      await this.cacheManager.set(
        this.getChallengeCacheKey(challenge.challengeId),
        {
          ...challengeState,
          attempts: nextAttempts,
        },
        this.resolveAdminMfaChallengeTtlMs(),
      );
      await this.logAdminAuthAudit(req, 'mfa-verify', 'failure', {
        adminEmail: challenge.email,
        reason,
      });
      throw new UnauthorizedException('Invalid MFA code');
    };

    if (verificationMode === 'otp') {
      if (!this.isValidTotpCode(resolvedSecret.secret, body.otpCode || '')) {
        await registerMfaFailure('invalid-otp');
      }
      if (credential) {
        credential.lastVerifiedAt = new Date();
        credential = await this.adminMfaCredentialRepository.save(credential);
      }
    } else {
      if (!credential?.enabled) {
        await registerMfaFailure('recovery-unavailable');
      }
      const enabledCredential = credential as AdminMfaCredential;
      const recoveryCodeMatches = await this.verifyRecoveryCodeForCredential(
        enabledCredential,
        body.recoveryCode || '',
        true,
      );
      if (!recoveryCodeMatches) {
        await registerMfaFailure('invalid-recovery-code');
      }
    }

    await this.clearAdminMfaChallenge(challenge.challengeId);
    const token = this.signAdminAccessToken(challenge.email, true);
    this.setAdminCookie(res, token);
    await this.logAdminAuthAudit(req, 'mfa-verify', 'success', {
      adminEmail: challenge.email,
      metadata: {
        method: verificationMode,
        recoveryCodesRemaining: credential?.recoveryCodeHashes?.length,
      },
    });
    return {
      access_token: token,
      role: 'admin',
      mfaVerified: true,
      mfaMethod: verificationMode,
      recoveryCodesRemaining: credential?.recoveryCodeHashes?.length,
    };
  }

  @Get('auth/mfa/status')
  async getAdminMfaStatus(@Req() req: Request & { user?: { email?: string } }) {
    const adminEmail =
      (typeof req.user?.email === 'string'
        ? this.normalizeAdminEmail(req.user.email)
        : this.getConfiguredAdminEmail()) || null;
    if (!adminEmail) {
      throw new UnauthorizedException('Admin identity unavailable');
    }

    const credential = await this.getAdminMfaCredential(adminEmail);
    const resolvedSecret = await this.getResolvedMfaSecretForAdmin(adminEmail);
    return {
      mfaRequired: this.isAdminMfaRequired(),
      enrolled: !!resolvedSecret,
      source: resolvedSecret?.source || null,
      recoveryCodesRemaining: credential?.recoveryCodeHashes?.length ?? 0,
      lastVerifiedAt: credential?.lastVerifiedAt || null,
      recoveryCodesGeneratedAt: credential?.recoveryCodesGeneratedAt || null,
    };
  }

  @Post('auth/mfa/recovery-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  async regenerateAdminRecoveryCodes(
    @Req() req: Request & { user?: { email?: string } },
    @Body() body: AdminRegenerateRecoveryCodesDto,
  ) {
    const adminEmail = req.user?.email
      ? this.normalizeAdminEmail(req.user.email)
      : null;
    if (!adminEmail) {
      throw new UnauthorizedException('Admin identity unavailable');
    }

    const mode = this.requireOtpOrRecoveryCode(body.otpCode, body.recoveryCode);
    const resolvedSecret = await this.getResolvedMfaSecretForAdmin(adminEmail);
    const credential = await this.getAdminMfaCredential(adminEmail);

    if (!resolvedSecret || !credential?.enabled) {
      await this.logAdminAuthAudit(req, 'recovery-codes-regenerate', 'failure', {
        adminEmail,
        reason: 'mfa-not-enrolled',
      });
      throw new UnauthorizedException('Admin MFA is not enrolled');
    }

    let verified = false;
    if (mode === 'otp') {
      verified = this.isValidTotpCode(resolvedSecret.secret, body.otpCode || '');
    } else {
      verified = await this.verifyRecoveryCodeForCredential(
        credential,
        body.recoveryCode || '',
        false,
      );
    }

    if (!verified) {
      await this.logAdminAuthAudit(req, 'recovery-codes-regenerate', 'failure', {
        adminEmail,
        reason: `invalid-${mode}`,
      });
      throw new UnauthorizedException('Invalid MFA verification');
    }

    const recoveryCodes = this.generateRecoveryCodes();
    credential.recoveryCodeHashes = recoveryCodes.map((code) =>
      this.hashRecoveryCode(adminEmail, code),
    );
    credential.recoveryCodesGeneratedAt = new Date();
    credential.lastVerifiedAt = new Date();
    await this.adminMfaCredentialRepository.save(credential);

    await this.logAdminAuthAudit(req, 'recovery-codes-regenerate', 'success', {
      adminEmail,
      metadata: { method: mode, recoveryCodeCount: recoveryCodes.length },
    });
    return {
      recoveryCodes,
      recoveryCodesRemaining: recoveryCodes.length,
    };
  }

  @Get('auth/audit-logs')
  async getAdminAuthAuditLogs(
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Query('eventType') eventType?: string,
    @Query('outcome') outcome?: AdminAuthAuditOutcome,
  ) {
    const resolvedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const resolvedOffset = Math.max(parseInt(offset, 10) || 0, 0);
    const queryBuilder =
      this.adminAuthAuditLogRepository.createQueryBuilder('audit');

    if (eventType) {
      queryBuilder.andWhere('audit.eventType = :eventType', { eventType });
    }
    if (outcome === 'success' || outcome === 'failure') {
      queryBuilder.andWhere('audit.outcome = :outcome', { outcome });
    }

    queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .skip(resolvedOffset)
      .take(resolvedLimit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return {
      data,
      total,
      limit: resolvedLimit,
      offset: resolvedOffset,
    };
  }

  @Public()
  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async adminLogout(
    @Req() req: Request & { user?: { email?: string } },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    this.clearAdminCookie(res);
    const adminEmail = req.user?.email
      ? this.normalizeAdminEmail(req.user.email)
      : null;
    await this.logAdminAuthAudit(req, 'logout', 'success', {
      adminEmail,
    });
    return { success: true };
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('user-analytics/:timeRange')
  async getUserAnalytics(@Param('timeRange') timeRange: string) {
    return this.adminService.getUserAnalytics(timeRange);
  }

  @Get('revenue-analytics/:timeRange')
  async getRevenueAnalytics(@Param('timeRange') timeRange: string) {
    return this.adminService.getRevenueAnalytics(timeRange);
  }

  @Get('system-health')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('activity-feed')
  async getActivityFeed(@Query('limit') limit: string = '5') {
    return this.adminService.getActivityFeed(parseInt(limit));
  }

  @Get('users')
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(parseInt(page), parseInt(limit), search);
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Get('trades')
  async getTrades(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getTrades(parseInt(page), parseInt(limit), status, userId);
  }

  @Get('accounts')
  async getAccounts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getAccounts(parseInt(page), parseInt(limit), userId);
  }

  @Get('subscriptions')
  async getSubscriptions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    return this.adminService.getSubscriptions(parseInt(page), parseInt(limit), status, plan);
  }

  @Get('database/tables')
  async getDatabaseTables() {
    return this.adminService.getDatabaseTables();
  }

  @Get('database/table/:table')
  async getDatabaseTable(@Param('table') table: string) {
    return this.adminService.getDatabaseTable(table);
  }

  @Get('database/columns/:table')
  async getDatabaseColumns(@Param('table') table: string) {
    return this.adminService.getDatabaseColumns(table);
  }

  @Get('database/rows/:table')
  async getDatabaseRows(
    @Param('table') table: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getDatabaseRows(
      table,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Post('seed-sample-data')
  async seedSampleData() {
    this.ensureDangerousOperationsAllowed();
    return this.adminService.seedSampleData();
  }

  @Post('test-user/create')
  async createTestUser() {
    this.ensureDangerousOperationsAllowed();
    const result = await this.testUserSeedService.createTestUser();
    return {
      message: 'Test user created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      stats: result.stats,
    };
  }

  @Delete('test-user/delete')
  async deleteTestUser() {
    this.ensureDangerousOperationsAllowed();
    await this.testUserSeedService.deleteTestUser();
    return {
      message: 'Test user deleted successfully',
    };
  }

  @Delete('database/clear-table/:tableName')
  async clearTable(
    @Param('tableName') tableName: string,
    @Query('confirm') confirm: string,
  ) {
    this.ensureDangerousOperationsAllowed();
    if (confirm !== 'DELETE_ALL_DATA') {
      return {
        error: 'Safety confirmation required',
        message: 'Add query parameter: ?confirm=DELETE_ALL_DATA',
      };
    }

    const result = await this.adminService.clearTable(tableName);
    return {
      message: `Table ${tableName} cleared successfully`,
      deletedCount: result.deletedCount,
    };
  }

  @Delete('database/clear-all-tables')
  async clearAllTables(
    @Query('confirm') confirm: string,
    @Query('doubleConfirm') doubleConfirm: string,
  ) {
    this.ensureDangerousOperationsAllowed();
    if (
      confirm !== 'DELETE_ALL_DATA' ||
      doubleConfirm !== 'I_UNDERSTAND_THIS_WILL_DELETE_EVERYTHING'
    ) {
      return {
        error: 'Double safety confirmation required',
        message:
          'Add query parameters: ?confirm=DELETE_ALL_DATA&doubleConfirm=I_UNDERSTAND_THIS_WILL_DELETE_EVERYTHING',
      };
    }

    const result = await this.adminService.clearAllTables();
    return {
      message: 'All tables cleared successfully',
      tablesCleared: result.tablesCleared,
      totalDeleted: result.totalDeleted,
    };
  }

  @Get('database/table-stats')
  async getTableStats() {
    return this.adminService.getTableStats();
  }

  @Post('database/run-sql')
  async runSql(
    @Query('confirm') confirm: string,
    @Body() body: { sql: string },
  ) {
    this.ensureDangerousOperationsAllowed();
    if (confirm !== 'ADMIN_SQL_EXECUTE') {
      return {
        error: 'Safety confirmation required',
        message: 'Add query parameter: ?confirm=ADMIN_SQL_EXECUTE',
      };
    }

    return this.adminService.runSql(body.sql);
  }

  private ensureDangerousOperationsAllowed() {
    if (process.env.ALLOW_ADMIN_DANGEROUS_OPERATIONS !== 'true') {
      throw new ForbiddenException(
        'Dangerous admin operations are disabled in this environment',
      );
    }
  }
}
