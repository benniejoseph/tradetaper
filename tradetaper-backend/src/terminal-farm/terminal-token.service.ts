import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TerminalTokenService {
  constructor(private readonly jwtService: JwtService) {}

  signTerminalToken(terminalId: string): string {
    return this.jwtService.sign(
      { terminalId, scope: 'terminal' },
      { expiresIn: '7d' },
    );
  }

  verifyTerminalToken(token: string): { terminalId: string } | null {
    try {
      const payload = this.jwtService.verify(token);
      if (!payload || payload.scope !== 'terminal' || !payload.terminalId) {
        return null;
      }
      return { terminalId: payload.terminalId };
    } catch {
      return null;
    }
  }
}
