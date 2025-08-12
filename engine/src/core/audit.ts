import { openDb } from './db.js';
import crypto from 'crypto';

export type AuditStatus = 'success' | 'error' | 'denied';

export function recordAudit(action: string, target: string, status: AuditStatus, detail?: unknown, actor?: string) {
  try {
    const db = openDb();
    const id = crypto.randomUUID();
    db.prepare(
      'INSERT INTO audit_logs (id, actor, action, target, status, detail) VALUES (?, ?, ?, ?, ?, ?)' 
    ).run(id, actor || 'api', action, target, status, detail ? JSON.stringify(detail) : null);
  } catch {
    // best-effort; avoid throwing from audit path
  }
}


