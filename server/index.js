import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { sanitizeRequest } from './validation/middleware.js';
import { checkIPBlocklist } from './middleware/blocklist.js';
import { requestLogger } from './middleware/requestLogger.js';
import { globalLimiter, quotaMiddleware } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/api.routes.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { checkGeminiHealth } from './services/gemini.service.js';
import { handleHealth } from './controllers/api.controller.js';
import { getModelForTask } from './config.js';
import { redis } from './utils/redis.js';

const app = express();
const PORT = env.PORT;

const hasGeminiApiKey = Boolean(env.GEMINI_API_KEY);
if (!hasGeminiApiKey) {
  console.warn('GEMINI_API_KEY not set in server environment. Health checks will report the server as misconfigured.');
}

const SERVER_CLIENT_TOKEN = env.SERVER_CLIENT_TOKEN || null;
if (!SERVER_CLIENT_TOKEN) {
  console.warn(
    'WARNING: SERVER_CLIENT_TOKEN not set. Requests without Authorization will be rejected.'
  );
}

app.use(checkIPBlocklist);
app.use(requestLogger);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'none'"],
      connectSrc: ["'none'"],
      fontSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors());
app.use(express.json({ limit: '128kb' }));
app.use(sanitizeRequest);

app.use(cookieParser());
app.use((req, res, next) => {
  const originalCookie = res.cookie;
  res.cookie = function (name, value, options = {}) {
    options.httpOnly = options.httpOnly ?? true;
    options.secure = options.secure ?? (env.NODE_ENV === 'production');
    options.sameSite = options.sameSite ?? 'strict';
    return originalCookie.call(this, name, value, options);
  };
  next();
});

app.use(['/api/generate/', `/api/v1/generate/`, `/api/v1/ai/`], (req, res, next) => {
  res.set('Cache-Control', 'no-store, max-age=0');
  res.set('Pragma', 'no-cache');
  next();
});

app.use('/api/', globalLimiter);
app.use('/api/', quotaMiddleware);

app.use('/api', apiRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Centralized error handler
app.use(errorHandler);

if (env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`AI gateway listening on port ${PORT}`);
    console.log(`Models: website=${getModelForTask('website')}, newsletter=${getModelForTask('newsletter')}, analysis=${getModelForTask('analysis')}`);
  });
}

export { app, handleHealth, checkGeminiHealth };

process.on('SIGTERM', async () => {
  if (redis?.status === 'ready') await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (redis?.status === 'ready') await redis.quit();
  process.exit(0);
});
