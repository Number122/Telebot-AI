import { MessageHandler } from './handlers/messageHandler';
import { Logger } from './utils/logger';
import express from 'express';
import config from './config/config';

const logger = new Logger('Main');
const app = express();
const port = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Bot is running! 🤖');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

async function main() {
    try {
        logger.info('Starting Telegram OpenAI Bridge...');
        
        const handler = new MessageHandler();
        await handler.initialize();
        
        // Start Express server
        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
        
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