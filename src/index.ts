import { MessageHandler } from './handlers/messageHandler';
import { Logger } from './utils/logger';

const logger = new Logger('Main');

async function main() {
    try {
        logger.info('Starting Telegram OpenAI Bridge...');
        
        const handler = new MessageHandler();
        await handler.initialize();
        
        logger.info('Bot is running. Press Ctrl+C to stop.');
        
        // Keep the process running
        process.on('SIGINT', () => {
            logger.info('Shutting down...');
            process.exit(0);
        });
    } catch (error) {
        logger.error('Failed to start the application', error);
        process.exit(1);
    }
}

main(); 