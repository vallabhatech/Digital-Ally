const MAX_LOG_ENTRIES = 1000;
const ERROR_WINDOW = 10 * 60 * 1000; // 10 minutes
const ERROR_THRESHOLD = 50;
const BLOCK_DURATION = 60 * 60 * 1000; // 1 hour

export const requestLog = [];
export const abuseReports = [];
export const ipErrorCounts = new Map();
export const blockedIPs = new Map();

export function addToLog(entry) {
  requestLog.push(entry);
  if (requestLog.length > MAX_LOG_ENTRIES) requestLog.shift();
}

export function addAbuseReport(entry) {
  abuseReports.push(entry);
  if (abuseReports.length > MAX_LOG_ENTRIES) abuseReports.shift();
}

export function trackError(ip) {
  const now = Date.now();
  if (!ipErrorCounts.has(ip)) ipErrorCounts.set(ip, []);
  
  const errors = ipErrorCounts.get(ip);
  errors.push(now);
  
  const validErrors = errors.filter(time => now - time < ERROR_WINDOW);
  ipErrorCounts.set(ip, validErrors);
  
  if (validErrors.length >= ERROR_THRESHOLD && !blockedIPs.has(ip)) {
    blockedIPs.set(ip, now + BLOCK_DURATION);
  }
  return validErrors.length;
}

export function isIPBlocked(ip) {
  if (!blockedIPs.has(ip)) return false;
  const unblockTime = blockedIPs.get(ip);
  if (Date.now() > unblockTime) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
}
