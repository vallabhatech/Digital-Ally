import { randomUUID } from 'node:crypto';

const MAX_AUDIT_ENTRIES = 2000;
const auditLog = [];

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
  if (auditLog.length > MAX_AUDIT_ENTRIES) {
    auditLog.shift();
  }

  console.log(JSON.stringify({ type: 'audit', ...record }));
  return record;
}

export function getAuditLog() {
  return [...auditLog];
}

function findIndexByTime(logs, timeMs, isStart) {
  let low = 0;
  let high = logs.length - 1;
  let result = isStart ? 0 : logs.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midTime = new Date(logs[mid].timestamp).getTime();
    if (midTime === timeMs) {
      return mid;
    } else if (midTime < timeMs) {
      if (isStart) result = mid + 1;
      low = mid + 1;
    } else {
      if (!isStart) result = mid - 1;
      high = mid - 1;
    }
  }
  return result;
}

export function queryAuditLog({ limit = 100, task, statusCode, since, until } = {}) {
  let entries = auditLog;

  let startIndex = 0;
  let endIndex = entries.length - 1;

  if (since) {
    const sinceDate = new Date(since).getTime();
    startIndex = Math.max(startIndex, findIndexByTime(entries, sinceDate, true));
  }
  if (until) {
    const untilDate = new Date(until).getTime();
    endIndex = Math.min(endIndex, findIndexByTime(entries, untilDate, false));
  }

  if (startIndex > endIndex || entries.length === 0) {
    return { entries: [], total: 0, returned: 0, limit };
  }

  entries = entries.slice(startIndex, endIndex + 1);

  if (task) {
    entries = entries.filter((e) => e.task === task);
  }
  if (statusCode) {
    entries = entries.filter((e) => e.statusCode === statusCode);
  }

  const total = entries.length;
  const capped = entries.slice(-limit).reverse();

  return { entries: capped, total, returned: capped.length, limit };
}
