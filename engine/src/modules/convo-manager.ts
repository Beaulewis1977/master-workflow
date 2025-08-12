import { openDb } from '../core/db.js';
import { createLogger } from '../core/logging.js';

const logger = createLogger('convo');

export type Attachment = { type: 'image'|'log'|'text'; name: string; data?: string; url?: string };

export function ensureSession(sessionId: string, userAgent?: string, envInfo?: unknown) {
  const db = openDb();
  const get = db.prepare('SELECT id FROM sessions WHERE id = ?');
  const row = get.get(sessionId);
  if (!row) {
    db.prepare('INSERT INTO sessions (id, user_agent, env_info) VALUES (?, ?, ?)')
      .run(sessionId, userAgent || '', JSON.stringify(envInfo || {}));
    logger.info({ sessionId }, 'Session created');
  }
}

export function addMessage(sessionId: string, role: 'user'|'assistant', content: string, attachments?: Attachment[]) {
  const db = openDb();
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO messages (id, session_id, role, content, attachments) VALUES (?, ?, ?, ?, ?)')
    .run(id, sessionId, role, content, attachments ? JSON.stringify(attachments) : null);
  return id;
}

export function getThread(sessionId: string) {
  const db = openDb();
  const sess = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!sess) return null;
  const msgs = db.prepare('SELECT id, role, content, attachments, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC')
    .all(sessionId)
    .map((m: any) => ({ ...m, attachments: m.attachments ? JSON.parse(m.attachments) : [] }));
  return { session: sess, messages: msgs };
}

export function generateReply(input: { text?: string; images?: Attachment[] }) {
  const actions: Array<{ type: string; params?: Record<string, unknown> }> = [];
  const text = (input.text || '').toLowerCase();
  if (text.includes('install')) actions.push({ type: 'suggest_install_plan' });
  if (text.includes('analyze')) actions.push({ type: 'env_scan' });
  const reply = input.images && input.images.length > 0
    ? `Received ${input.images.length} attachment(s). What would you like me to do with them?`
    : 'Acknowledged. How can I help further?';
  return { reply, actions };
}


