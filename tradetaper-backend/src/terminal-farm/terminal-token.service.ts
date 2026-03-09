import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type TerminalTokenPayload = {
  terminalId: string;
  accountFingerprint?: string;
};

@Injectable()
export class TerminalTokenService {
  constructor(private readonly jwtService: JwtService) {}

  signTerminalToken(
    terminalId: string,
    accountFingerprint?: string,
  ): string {
    // Keep terminal JWT compact for MT5 input field limits.
    // `accountFingerprint` is enforced separately via pairing + MT5 identity checks.
    return this.jwtService.sign(
      { t: terminalId, s: 't' },
      { expiresIn: '7d' },
    );
  }

  verifyTerminalToken(token: string): TerminalTokenPayload | null {
    try {
      const payload = this.jwtService.verify(token) as {
        t?: string;
        s?: string;
        terminalId?: string;
        accountFingerprint?: string;
        scope?: string;
      };
      if (!payload) {
        return null;
      }

      const terminalId = payload.t || payload.terminalId;
      const scope = payload.s || payload.scope;
      if (!terminalId || (scope && scope !== 't' && scope !== 'terminal')) {
        return null;
      }
      return {
        terminalId,
        accountFingerprint: payload.accountFingerprint,
      };
    } catch {
      return null;
    }
  }
}
