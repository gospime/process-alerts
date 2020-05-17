/**
 * Graceful shutdown
 * http://pm2.keymetrics.io/docs/usage/signals-clean-restart/
 */

const pino = require('pino');

const dest = pino.extreme();
const logger = pino(dest);

// asynchronously flush every 10 seconds to keep the buffer empty
// in periods of low activity
// $FlowFixMe
setInterval(() => logger.flush(), 10000).unref();

// use pino.final to create a special logger that
// guarantees final tick writes
const handler = pino.final(logger, (error, finalLogger, signal) => {
  finalLogger.info(`${signal} caught`);
  if (error) {
    console.error(error);
    finalLogger.error(error, 'error caused exit');
  }
  console.info(
    `The service node needs to be restarted. '${signal}' signal was called`
  );
  process.exit(error ? 1 : 0);
});

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', () => handler(null, 'SIGINT'));

// listen for TERM signal .e.g. kill
process.on('SIGTERM', () => handler(null, 'SIGTERM'));

// listen for TERM signal .e.g. kill
process.on('SIGQUIT', () => handler(null, 'SIGQUIT'));

process.on('beforeExit', () => handler(null, 'beforeExit'));

process.on('exit', () => handler(null, 'exit'));

process.on('uncaughtException', error => handler(error, 'uncaughtException'));
process.on('unhandledRejection', error => handler(error, 'unhandledRejection'));
process.on('warning', error = > handler(error, 'warning'));

// Windows graceful stop
process.on('message', message => {
  if (message !== 'shutdown') return;
  handler(null, 'SHUTDOWN');
});
