import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

async function swaggerPluginHandler(fastify: FastifyInstance): Promise<void> {
  // Register @fastify/swagger for OpenAPI generation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Eurostar Portfolio API',
        description:
          'API for managing IT project portfolio with budget tracking, governance workflows, and reporting',
        version: '1.0.0',
      },
      servers: [
        {
          url: '/api',
          description: 'API base path',
        },
      ],
      tags: [
        { name: 'Projects', description: 'Project management endpoints' },
        { name: 'Departments', description: 'Department referential data' },
        { name: 'Teams', description: 'Team referential data' },
        { name: 'Statuses', description: 'Project status referential data' },
        { name: 'Outcomes', description: 'Outcome referential data' },
        {
          name: 'Cost Centers',
          description: 'Cost center referential data',
        },
        {
          name: 'Currency Rates',
          description: 'Currency exchange rate data',
        },
        {
          name: 'Thresholds',
          description: 'Committee threshold configuration',
        },
        { name: 'Budget Lines', description: 'Budget line management' },
        { name: 'Actuals', description: 'Project actuals and receipts' },
        { name: 'Alerts', description: 'Alert and notification management' },
        { name: 'Admin', description: 'Administrative operations' },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'EntraID JWT token',
          },
        },
        responses: {
          BadRequest: {
            description: 'Validation error - request body does not match schema',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    details: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          Unauthorized: {
            description:
              'Authentication required - missing or invalid bearer token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          Forbidden: {
            description: 'Insufficient permissions - admin access required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          NotFound: {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          InternalServerError: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      security: [{ BearerAuth: [] }],
    },
    transform: jsonSchemaTransform,
  });

  // Register Swagger UI with Eurostar branding
  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
    staticCSP: false,
    theme: {
      title: 'Eurostar Portfolio API',
      css: [
        {
          filename: 'theme.css',
          content: `
            /* Eurostar teal theme */
            .swagger-ui .topbar {
              background-color: #086264 !important;
            }
            .swagger-ui .opblock-tag {
              color: #086264 !important;
            }
            .swagger-ui .btn.authorize {
              background-color: #086264 !important;
              border-color: #086264 !important;
            }
            .swagger-ui .btn.authorize svg {
              fill: #fff !important;
            }
            .swagger-ui .opblock .opblock-summary {
              border-left: 3px solid #086264 !important;
            }
            .swagger-ui .opblock.opblock-get .opblock-summary-method {
              background: #086264 !important;
            }
            .swagger-ui .opblock.opblock-post .opblock-summary-method {
              background: #086264 !important;
            }
            .swagger-ui .opblock.opblock-put .opblock-summary-method {
              background: #086264 !important;
            }
            .swagger-ui .opblock.opblock-delete .opblock-summary-method {
              background: #d32f2f !important;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif !important;
            }
            .swagger-ui .info .title {
              color: #086264 !important;
            }
            .swagger-ui a {
              color: #086264 !important;
            }
            .swagger-ui .scheme-container {
              background: #f5f5f5 !important;
              box-shadow: none !important;
            }
          `,
        },
      ],
    },
    transformSpecificationClone: true,
  });
}

export const swaggerPlugin = fp(swaggerPluginHandler, {
  name: 'swagger-plugin',
});
