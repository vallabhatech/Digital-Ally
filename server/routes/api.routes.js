import { Router } from 'express';
import {
  handleCentralizedAiGenerate,
  handleHealth,
  handleConfig,
  handleUsage,
  handleLogs,
  handleAudit,
  handleAbuseReport,
} from '../controllers/api.controller.js';
import { requireAuth, requireAdmin, requireAiConsent } from '../middleware/auth.js';
import { generateLimiter } from '../middleware/rateLimit.js';
import { createLogger } from '../logger.js';
import { validateQuery } from '../validation/middleware.js';
import { logQuerySchema, auditQuerySchema } from '../validation/schemas.js';

const router = Router();
const API_VERSION = 'v1';
const API_DEPRECATION_SUNSET = 'Wed, 31 Dec 2026 23:59:59 GMT';

function setApiVersionHeader(req, res, next) {
  res.set('API-Version', API_VERSION);
  next();
}

function setDeprecatedApiHeaders(successorPath) {
  return (req, res, next) => {
    res.set('API-Version', API_VERSION);
    res.set('Deprecation', 'true');
    res.set('Sunset', API_DEPRECATION_SUNSET);
    res.set('Link', `<${successorPath}>; rel="successor-version"`);
    next();
  };
}

const generateLogger = createLogger();
const aiRouteMiddleware = [
  generateLimiter,
  requireAiConsent,
  generateLogger,
];

router.use(`/${API_VERSION}`, setApiVersionHeader);
router.use(
  ['/generate/', '/health', '/usage', '/logs', '/audit'],
  setDeprecatedApiHeaders(`/api/${API_VERSION}`)
);

// Health & Config
router.get(`/${API_VERSION}/health`, handleHealth);
router.get('/health', handleHealth);
router.get(`/${API_VERSION}/config`, requireAuth, handleConfig);
router.get('/config', requireAuth, handleConfig);
router.get(`/${API_VERSION}/usage`, handleUsage);
router.get('/usage', handleUsage);

// Generation (Centralized)
router.post(
  `/${API_VERSION}/ai/generate`,
  requireAuth,
  ...aiRouteMiddleware,
  handleCentralizedAiGenerate
);

// Legacy routes mapped to centralized logic for backward compatibility
router.post(
  `/${API_VERSION}/generate/website`,
  requireAuth,
  ...aiRouteMiddleware,
  (req, res, next) => {
    req.body.task = 'website';
    handleCentralizedAiGenerate(req, res, next);
  }
);
router.post(
  '/generate/website',
  requireAuth,
  ...aiRouteMiddleware,
  (req, res, next) => {
    req.body.task = 'website';
    handleCentralizedAiGenerate(req, res, next);
  }
);
router.post(
  `/${API_VERSION}/generate/newsletter`,
  requireAuth,
  ...aiRouteMiddleware,
  (req, res, next) => {
    req.body.task = 'newsletter';
    handleCentralizedAiGenerate(req, res, next);
  }
);
router.post(
  '/generate/newsletter',
  requireAuth,
  ...aiRouteMiddleware,
  (req, res, next) => {
    req.body.task = 'newsletter';
    handleCentralizedAiGenerate(req, res, next);
  }
);
router.post(
  `/${API_VERSION}/generate/analysis`,
  requireAuth,
  ...aiRouteMiddleware,
  (req, res, next) => {
    req.body.task = 'analysis';
    handleCentralizedAiGenerate(req, res, next);
  }
);
router.post(
  '/generate/analysis',
  requireAuth,
  ...aiRouteMiddleware,
  (req, res, next) => {
    req.body.task = 'analysis';
    handleCentralizedAiGenerate(req, res, next);
  }
);

// Admin Routes
router.get(`/${API_VERSION}/logs`, requireAdmin, validateQuery(logQuerySchema), handleLogs);
router.get('/logs', requireAdmin, validateQuery(logQuerySchema), handleLogs);
router.get(`/${API_VERSION}/audit`, requireAdmin, validateQuery(auditQuerySchema), handleAudit);
router.get('/audit', requireAdmin, validateQuery(auditQuerySchema), handleAudit);
router.post(`/${API_VERSION}/abuse/report`, generateLimiter, handleAbuseReport);

export default router;
