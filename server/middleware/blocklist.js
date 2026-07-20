import { isIPBlocked } from '../services/logStore.js';
import { getClientIdentifier } from './rateLimit.js';
import { AppError } from '../utils/AppError.js';

export function checkIPBlocklist(req, res, next) {
  const clientIdentifier = getClientIdentifier(req);
  if (isIPBlocked(clientIdentifier)) {
    return next(new AppError(403, 'IP_BLOCKED', 'Client blocked due to excessive errors'));
  }
  next();
}
