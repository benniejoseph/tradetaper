'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api-base-url';

type LoginStep = 'credentials' | 'mfa' | 'enroll' | 'recovery-codes';
type MfaMethod = 'otp' | 'recovery';

interface AdminLoginResponse {
  access_token?: string;
  role?: 'admin';
  mfaRequired?: boolean;
  mfaEnrollmentRequired?: boolean;
  challengeMethod?: 'totp' | 'totp_or_recovery';
  challengeToken?: string;
  mfaVerified?: boolean;
  mfaEnrolled?: boolean;
  bootstrapToken?: string;
  otpauthUrl?: string;
  manualEntryKey?: string;
  qrCodeDataUrl?: string;
  recoveryCodes?: string[];
  recoveryCodesRemaining?: number;
  mfaMethod?: MfaMethod;
  message?: string | string[];
}

function getErrorMessage(
  payload: Pick<AdminLoginResponse, 'message'> | null,
  fallback: string,
): string {
  if (!payload?.message) {
    return fallback;
  }
  if (typeof payload.message === 'string') {
    return payload.message;
  }
  if (Array.isArray(payload.message) && payload.message.length > 0) {
    return payload.message[0];
  }
  return fallback;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mfaMethod, setMfaMethod] = useState<MfaMethod>('otp');
  const [otpCode, setOtpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [mfaChallengeToken, setMfaChallengeToken] = useState('');

  const [bootstrapToken, setBootstrapToken] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [enrollmentOtpCode, setEnrollmentOtpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const isCredentialsStep = step === 'credentials';
  const isMfaStep = step === 'mfa';
  const isEnrollStep = step === 'enroll';
  const isRecoveryCodesStep = step === 'recovery-codes';

  const submitLabel = useMemo(() => {
    if (loading) {
      if (isMfaStep) {
        return 'Verifying…';
      }
      if (isEnrollStep) {
        return 'Activating MFA…';
      }
      return 'Authenticating…';
    }
    if (isMfaStep) {
      return 'Verify & Sign In';
    }
    if (isEnrollStep) {
      return 'Activate MFA';
    }
    return 'Continue';
  }, [isEnrollStep, isMfaStep, loading]);

  const resetToCredentials = () => {
    setStep('credentials');
    setMfaMethod('otp');
    setOtpCode('');
    setRecoveryCode('');
    setMfaChallengeToken('');
    setBootstrapToken('');
    setManualEntryKey('');
    setOtpauthUrl('');
    setQrCodeDataUrl('');
    setEnrollmentOtpCode('');
    setRecoveryCodes([]);
    setError('');
  };

  const handleInitialLogin = async (): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = (await res.json().catch(() => null)) as
      | AdminLoginResponse
      | null;
    if (!res.ok) {
      throw new Error(getErrorMessage(data, 'Invalid credentials'));
    }

    if (data?.mfaEnrollmentRequired) {
      if (!data.bootstrapToken || !data.manualEntryKey || !data.qrCodeDataUrl) {
        throw new Error('MFA enrollment bootstrap payload is incomplete');
      }
      setStep('enroll');
      setBootstrapToken(data.bootstrapToken);
      setManualEntryKey(data.manualEntryKey);
      setOtpauthUrl(data.otpauthUrl || '');
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setEnrollmentOtpCode('');
      toast.success('Scan the QR code and enter your first code');
      return;
    }

    if (data?.mfaRequired) {
      if (!data.challengeToken) {
        throw new Error('MFA challenge could not be created');
      }
      setStep('mfa');
      setMfaMethod('otp');
      setMfaChallengeToken(data.challengeToken);
      setOtpCode('');
      setRecoveryCode('');
      toast.success('Enter your authenticator code');
      return;
    }

    toast.success('Welcome back!');
    router.push(from);
  };

  const handleMfaVerification = async (): Promise<void> => {
    const payload =
      mfaMethod === 'otp'
        ? { challengeToken: mfaChallengeToken, otpCode }
        : { challengeToken: mfaChallengeToken, recoveryCode };

    const res = await fetch(`${API_BASE_URL}/admin/auth/verify-mfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as
      | AdminLoginResponse
      | null;
    if (!res.ok) {
      throw new Error(getErrorMessage(data, 'MFA verification failed'));
    }

    toast.success('Admin verification complete');
    router.push(from);
  };

  const handleEnrollmentComplete = async (): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/admin/auth/mfa/bootstrap/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        bootstrapToken,
        otpCode: enrollmentOtpCode,
      }),
    });
    const data = (await res.json().catch(() => null)) as
      | AdminLoginResponse
      | null;
    if (!res.ok) {
      throw new Error(getErrorMessage(data, 'MFA enrollment failed'));
    }
    if (!data?.recoveryCodes || data.recoveryCodes.length === 0) {
      throw new Error('Recovery codes were not returned');
    }

    setRecoveryCodes(data.recoveryCodes);
    setStep('recovery-codes');
    toast.success('MFA activated. Save your recovery codes now.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isCredentialsStep) {
        await handleInitialLogin();
      } else if (isMfaStep) {
        await handleMfaVerification();
      } else if (isEnrollStep) {
        await handleEnrollmentComplete();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryCodes = async () => {
    const text = recoveryCodes.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Recovery codes copied');
    } catch {
      toast.error('Copy failed. Please save manually.');
    }
  };

  return (
    <div className="admin-card p-8">
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: 'var(--gradient-brand)' }}
        >
          <TrendingUp className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gradient">TradeTaper</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Admin Portal
        </p>
      </div>

      {isRecoveryCodesStep ? (
        <div className="space-y-4">
          <div
            className="rounded-lg p-3 text-sm"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
          >
            Save these backup codes. Each code can be used once if you lose access
            to your authenticator app.
          </div>

          <div
            className="rounded-lg border p-3 font-mono text-sm space-y-1"
            style={{ borderColor: 'var(--border-default)' }}
          >
            {recoveryCodes.map((code) => (
              <div key={code}>{code}</div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyRecoveryCodes}
              className="admin-btn-secondary flex-1 justify-center"
            >
              <Copy className="w-4 h-4" />
              Copy Codes
            </button>
            <button
              type="button"
              onClick={() => {
                toast.success('MFA setup completed');
                router.push(from);
              }}
              className="admin-btn-primary flex-1 justify-center"
            >
              I Saved Them
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {isCredentialsStep && (
            <>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tradetaper.com"
                    required
                    className="admin-input pl-10"
                    autoComplete="email"
                    id="admin-email"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    className="admin-input pl-10 pr-10"
                    autoComplete="current-password"
                    id="admin-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {isMfaStep && (
            <>
              <div
                className="rounded-lg p-3 text-sm"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
              >
                Step 2 of 2: Verify your admin sign in.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMfaMethod('otp')}
                  className="admin-btn-secondary flex-1 justify-center"
                  style={{
                    borderColor:
                      mfaMethod === 'otp'
                        ? 'var(--accent-primary)'
                        : 'var(--border-default)',
                  }}
                >
                  Authenticator
                </button>
                <button
                  type="button"
                  onClick={() => setMfaMethod('recovery')}
                  className="admin-btn-secondary flex-1 justify-center"
                  style={{
                    borderColor:
                      mfaMethod === 'recovery'
                        ? 'var(--accent-primary)'
                        : 'var(--border-default)',
                  }}
                >
                  Recovery Code
                </button>
              </div>

              {mfaMethod === 'otp' ? (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Authenticator Code
                  </label>
                  <div className="relative">
                    <ShieldCheck
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))
                      }
                      placeholder="123456"
                      required
                      className="admin-input pl-10 tracking-[0.3em]"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      id="admin-otp-code"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Backup Recovery Code
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                      placeholder="ABCD-1234"
                      required
                      className="admin-input pl-10 font-mono uppercase"
                      autoComplete="off"
                      id="admin-recovery-code"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {isEnrollStep && (
            <>
              <div
                className="rounded-lg p-3 text-sm"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
              >
                Scan the QR code with your authenticator app, then enter the first
                6-digit code to finish MFA setup.
              </div>

              <div className="flex justify-center">
                {qrCodeDataUrl ? (
                  <Image
                    src={qrCodeDataUrl}
                    alt="MFA enrollment QR code"
                    width={280}
                    height={280}
                    className="rounded-lg border p-2 bg-white"
                    style={{ borderColor: 'var(--border-default)' }}
                  />
                ) : null}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Setup Key
                </label>
                <div
                  className="admin-input font-mono text-sm break-all"
                  style={{ minHeight: 44 }}
                >
                  {manualEntryKey}
                </div>
                {otpauthUrl ? (
                  <p
                    className="text-xs mt-2 break-all"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    URI: {otpauthUrl}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Authenticator Code
                </label>
                <div className="relative">
                  <ShieldCheck
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    value={enrollmentOtpCode}
                    onChange={(e) =>
                      setEnrollmentOtpCode(
                        e.target.value.replace(/[^\d]/g, '').slice(0, 6),
                      )
                    }
                    placeholder="123456"
                    required
                    className="admin-input pl-10 tracking-[0.3em]"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    id="admin-enrollment-otp-code"
                  />
                </div>
              </div>
            </>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={{
                  background: 'var(--accent-danger-subtle)',
                  color: 'var(--accent-danger)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="admin-btn-primary w-full justify-center py-3 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {submitLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>

          {!isCredentialsStep && (
            <button
              type="button"
              onClick={resetToCredentials}
              className="w-full text-sm py-2 rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              Back to credentials
            </button>
          )}
        </form>
      )}

      <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
        Access restricted to authorized TradeTaper administrators
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #10B981, transparent)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <Suspense
          fallback={
            <div className="admin-card p-8 text-center">
              <Loader2
                className="w-8 h-8 animate-spin mx-auto mb-4"
                style={{ color: 'var(--accent-primary)' }}
              />
              <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
