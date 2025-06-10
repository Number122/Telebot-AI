import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import bigInt from 'big-integer';
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
            let peer;
            try {
                peer = await this.client.getInputEntity(chatId);
            } catch (error) {
                this.logger.info(`Resolving peer for ${chatId}`);
                
                try {
                    // Try to get all dialogs first
                    const dialogs = await this.client.getDialogs({});
                    const targetDialog = dialogs.find(dialog => 
                        dialog.entity?.id?.toString() === chatId
                    );

                    if (targetDialog?.entity) {
                        peer = targetDialog.entity;
                    } else {
                        // If not in dialogs, try to get user info
                        try {
                            const user = await this.client.getEntity(chatId);
                            if (user) {
                                peer = user;
                            }
                        } catch (entityError) {
                            // Last resort: Try to add as contact
                            try {
                                await this.client.invoke(new Api.contacts.ImportContacts({
                                    contacts: [new Api.InputPhoneContact({
                                        clientId: bigInt(0),
                                        phone: chatId.toString(),
                                        firstName: 'User',
                                        lastName: chatId.toString()
                                    })]
                                }));
                                
                                peer = await this.client.getInputEntity(chatId);
                            } catch (contactError) {
                                this.logger.error(`Failed to resolve peer ${chatId}`);
                            }
                        }
                    }
                } catch (resolveError) {
                    this.logger.error(`Failed to resolve peer ${chatId}`);
                }
            }

            if (!peer) {
                this.logger.error(`No valid peer found for ${chatId}`);
                return false;
            }

            const inputEntity = await this.client.getInputEntity(peer);
            const result = await this.client.sendMessage(inputEntity, { message });
            this.logger.info(`Message sent to ${chatId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send message to ${chatId}`);
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

    async addContact(userId: string) {
        try {
            const result = await this.client.invoke(new Api.contacts.AddContact({
                id: userId,
                firstName: 'User',
                lastName: userId,
                phone: '',
                addPhonePrivacyException: true
            }));
            this.logger.info(`Added contact ${userId}`, { result });
            return true;
        } catch (error) {
            this.logger.error(`Failed to add contact ${userId}`, error);
            return false;
        }
    }
}

export default TelegramService; 