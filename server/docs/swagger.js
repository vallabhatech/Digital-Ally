import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Digital-Ally API',
    version: '1.0.0',
    description: 'API Documentation for Digital-Ally',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      clientAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Client-ID',
        description: 'Client UUID for quota tracking',
      },
      adminAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Admin-Token',
        description: 'Admin authorization token',
      },
    },
  },
  paths: {
    '/api/v1/health': {
      get: {
        summary: 'Check API and Gemini health',
        responses: {
          '200': { description: 'API is healthy' },
          '503': { description: 'Service unavailable' },
        }
      }
    },
    '/api/v1/usage': {
      get: {
        summary: 'Get client quota usage',
        security: [{ clientAuth: [] }],
        responses: {
          '200': { description: 'Usage data returned' }
        }
      }
    },
    '/api/v1/ai/generate': {
      post: {
        summary: 'Generate content using Gemini AI',
        security: [{ clientAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  task: { type: 'string', enum: ['website', 'newsletter', 'analysis'] },
                  prompt: { type: 'string' },
                  outputFormat: { type: 'string', enum: ['html', 'react', 'zip'] }
                },
                required: ['task', 'prompt']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Content generated successfully' }
        }
      }
    },
    '/api/v1/logs': {
      get: {
        summary: 'Get system request logs',
        security: [{ adminAuth: [] }],
        responses: {
          '200': { description: 'Logs returned' }
        }
      }
    },
    '/api/v1/audit': {
      get: {
        summary: 'Get system audit logs',
        security: [{ adminAuth: [] }],
        responses: {
          '200': { description: 'Audit logs returned' }
        }
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
