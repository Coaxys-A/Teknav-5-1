import { Injectable } from '@nestjs/common';

@Injectable()
export class TerminalSessionManager {
  private readonly sessions = new Map<string, number>();
  private readonly maxConnectionsPerIp = 3;

  allowConnection(ip: string | undefined, role?: string) {
    if (role && role.toUpperCase() !== 'OWNER') return false;
    const key = ip ?? 'unknown';
    const count = this.sessions.get(key) ?? 0;
    if (count >= this.maxConnectionsPerIp) return false;
    this.sessions.set(key, count + 1);
    return true;
  }

  release(ip: string | undefined) {
    const key = ip ?? 'unknown';
    const count = this.sessions.get(key) ?? 0;
    if (count <= 1) this.sessions.delete(key);
    else this.sessions.set(key, count - 1);
  }
}
