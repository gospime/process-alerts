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
setInterval(function () { logger.flush(); }, 10000).unref();

// use pino.final to create a special logger that
// guarantees final tick writes
const handler = pino.final(logger, function (error, finalLogger, evt) {
  finalLogger.info(`${evt} caught`);
  if (error) {
    console.error(error);
    finalLogger.error(error, 'error caused exit');
  }
  console.info(
    `The service node needs to be restarted. Reason: calles signal '${evt}'`
  );
  process.exit(error ? 1 : 0);
});

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', function () { handler(null, 'SIGINT'); });

// listen for TERM signal .e.g. kill
process.on('SIGTERM', function () { handler(null, 'SIGTERM'); });

// listen for TERM signal .e.g. kill
process.on('SIGQUIT', function () { handler(null, 'SIGQUIT'); });

process.on('beforeExit', function () { handler(null, 'beforeExit'); });

process.on('exit', function () { handler(null, 'exit'); });

process.on('uncaughtException', function (error) {
  handler(error, 'uncaughtException');
});

// Windows graceful stop
process.on('message', function (message) {
  if (message !== 'shutdown') return;
  handler(null, 'SHUTDOWN');
});

