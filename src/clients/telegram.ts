import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import config from '../config/config';
import { Logger } from '../utils/logger';

export class TelegramService {
    private client: TelegramClient;
    private logger: Logger;
    private isConnected: boolean = false;

    constructor() {
        this.logger = new Logger('TelegramService');
        const session = new StringSession(config.TELEGRAM_SESSION);
        
        this.client = new TelegramClient(
            session,
            parseInt(config.TELEGRAM_APP_ID),
            config.TELEGRAM_API_HASH,
            { 
                connectionRetries: 5,
                useWSS: false,
                maxConcurrentDownloads: 10,
                retryDelay: 1000,
                downloadRetries: 5,
                floodSleepThreshold: 60,
                autoReconnect: true
            }
        );
    }

    async start() {
        try {
            await this.client.connect();
            const me = await this.client.getMe();
            this.isConnected = true;
            this.logger.info('Telegram client connected', { username: (me as any).username });
        } catch (error: any) {
            this.logger.error('Failed to connect to Telegram', { error: error.message });
            throw error;
        }
    }

    async sendMessage(chatId: string, message: string) {
        if (!this.isConnected) {
            this.logger.error('Client not connected');
            return false;
        }

        try {
            this.logger.info(`Attempting to send message to chat ${chatId}`);
            
            // Try to resolve the peer
            let peer;
            try {
                peer = await this.client.getInputEntity(chatId);
                this.logger.info('Resolved peer:', { peer });
            } catch (error) {
                this.logger.error(`Failed to resolve peer for ${chatId}`, error);
                // Try sending directly
                const result = await this.client.sendMessage(chatId, { message });
                this.logger.info(`Message sent directly to chat ${chatId}`, { result });
                return true;
            }

            const result = await this.client.sendMessage(peer, { message });
            this.logger.info(`Message sent to chat ${chatId} through peer`, { result });
            return true;
        } catch (error) {
            this.logger.error(`Failed to send message to chat ${chatId}`, error);
            return false;
        }
    }

    getClient() {
        return this.client;
    }

    async getEntity(id: string | number) {
        if (!this.isConnected) {
            return null;
        }

        try {
            return await this.client.getEntity(id);
        } catch (error) {
            this.logger.error(`Failed to get entity for ${id}`, error);
            return null;
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
        }
    }
}

export default TelegramService; 