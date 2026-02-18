import { build } from './app.js';
import { config } from './config/index.js';
import { runStartupInit } from './db/init.js';

// Run startup initialization (migrations + system data)
await runStartupInit();

// Build the Fastify app
const fastify = await build({ logger: true });

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    fastify.log.info(`Server running on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
