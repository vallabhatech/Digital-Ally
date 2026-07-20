import { addToLog, trackError } from '../services/logStore.js';
import { getClientIdentifier } from './rateLimit.js';

export function requestLogger(req, res, next) {
  const clientIdentifier = getClientIdentifier(req);
  addToLog({
    ip: clientIdentifier,
    endpoint: req.path,
    timestamp: new Date().toISOString(),
    promptLength: req.body?.prompt?.length || 0,
    task: req.body?.task || null,
  });

  const originalJson = res.json;
  res.json = function (data) {
    if (res.statusCode >= 400 && res.statusCode < 600 && res.statusCode !== 429) {
      trackError(clientIdentifier);
    }
    return originalJson.call(this, data);
  };
  next();
}
