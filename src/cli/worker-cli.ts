import { ProcessManager } from '../services/process/ProcessManager.js';
import { getWorkerPort } from '../shared/worker-utils.js';
import { logger } from '../utils/logger.js';

const command = process.argv[2];
const port = getWorkerPort();

async function main() {
  switch (command) {
    case 'start': {
      const result = await ProcessManager.start(port);
      if (result.success) {
        logger.info('WORKER', `Worker started (PID: ${result.pid})`);
        const date = new Date().toISOString().slice(0, 10);
        logger.info('WORKER', `Logs: ~/.claude-mem/logs/worker-${date}.log`);
        process.exit(0);
      } else {
        logger.error('WORKER', `Failed to start: ${result.error}`);
        process.exit(1);
      }
      break;
    }

    case 'stop': {
      await ProcessManager.stop();
      logger.info('WORKER', 'Worker stopped');
      process.exit(0);
    }

    case 'restart': {
      const result = await ProcessManager.restart(port);
      if (result.success) {
        logger.info('WORKER', `Worker restarted (PID: ${result.pid})`);
        process.exit(0);
      } else {
        logger.error('WORKER', `Failed to restart: ${result.error}`);
        process.exit(1);
      }
      break;
    }

    case 'status': {
      const status = await ProcessManager.status();
      if (status.running) {
        logger.info('WORKER', 'Worker is running');
        logger.info('WORKER', `  PID: ${status.pid}`);
        logger.info('WORKER', `  Port: ${status.port}`);
        logger.info('WORKER', `  Uptime: ${status.uptime}`);
      } else {
        logger.info('WORKER', 'Worker is not running');
      }
      process.exit(0);
    }

    default:
      logger.info('WORKER', 'Usage: worker-cli.js <start|stop|restart|status>');
      process.exit(1);
  }
}

main().catch(error => {
  logger.error('WORKER', error);
  process.exit(1);
});
