import { env } from '../env.js';
import { getServerConfig } from '../config.js';
import { AppError } from '../utils/AppError.js';

const serverConfig = getServerConfig();
const CONSENT_VERSION = serverConfig.consentVersion;

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing Authorization header'));
  }
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new AppError(401, 'UNAUTHORIZED', 'Malformed Authorization header'));
  }
  if (parts[1] !== env.SERVER_CLIENT_TOKEN) {
    return next(new AppError(403, 'FORBIDDEN', 'Forbidden'));
  }
  next();
}

export function requireAdmin(req, res, next) {
  const adminToken = req.get('X-Admin-Token');
  if (!env.ADMIN_TOKEN || adminToken !== env.ADMIN_TOKEN) {
    return next(new AppError(403, 'FORBIDDEN', 'Admin token required'));
  }
  next();
}

export function requireAiConsent(req, res, next) {
  if (req.get('X-AI-Consent') !== CONSENT_VERSION) {
    return next(new AppError(428, 'CONSENT_REQUIRED', 'Current AI processing consent is required'));
  }
  next();
}
