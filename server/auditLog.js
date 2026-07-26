import { randomUUID } from 'node:crypto';
import { RingBuffer } from './ringBuffer.js';

const MAX_AUDIT_ENTRIES = 2000;
const auditLog = new RingBuffer(MAX_AUDIT_ENTRIES);

/**
 * Record a privacy-safe audit event (metadata only — no prompt or response bodies).
 */
export function recordAuditEvent(entry) {
  const record = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  auditLog.push(record);

  console.log(JSON.stringify({ type: 'audit', ...record }));
  return record;
}

export function getAuditLog() {
  return auditLog.toArray();
}

export function queryAuditLog({ limit = 100, task, statusCode, since, until } = {}) {
  let entries = getAuditLog();

  if (task) {
    entries = entries.filter((e) => e.task === task);
  }
  if (statusCode) {
    entries = entries.filter((e) => e.statusCode === statusCode);
  }
  if (since) {
    const sinceDate = new Date(since);
    entries = entries.filter((e) => new Date(e.timestamp) >= sinceDate);
  }
  if (until) {
    const untilDate = new Date(until);
    entries = entries.filter((e) => new Date(e.timestamp) <= untilDate);
  }

  const total = entries.length;
  const capped = entries.slice(-limit).reverse();

  return { entries: capped, total, returned: capped.length, limit };
}
