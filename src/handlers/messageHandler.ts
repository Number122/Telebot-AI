import { Logger } from '../utils/logger';
import { TelegramService } from '../clients/telegram';
import { OpenAIService } from '../clients/openai';
import { ConversationService } from '../services/conversation';
import { Api } from 'telegram/tl';

interface UpdateShortMessage {
    className: string;
    message: string;
    userId: string;
    out: boolean;
    date: number;
}

export class MessageHandler {
    private logger: Logger;
    private telegram: TelegramService;
    private openai: OpenAIService;
    private conversation: ConversationService;

    constructor() {
        this.logger = new Logger('MessageHandler');
        this.telegram = new TelegramService();
        this.openai = new OpenAIService();
        this.conversation = new ConversationService();
    }

    async initialize() {
        await this.telegram.start();
        this.setupMessageListener();
    }

    private setupMessageListener() {
        const client = this.telegram.getClient();
        
        client.addEventHandler(async (update: any) => {
            try {
                // Handle short messages
                if (update?.className === 'UpdateShortMessage') {
                    const shortMessage = update as UpdateShortMessage;
                    
                    // Skip outgoing messages
                    if (shortMessage.out) {
                        return;
                    }

                    this.logger.info('Received short message:', {
                        message: shortMessage.message,
                        userId: shortMessage.userId,
                        date: new Date(shortMessage.date * 1000).toISOString()
                    });

                    await this.handleIncomingMessage(
                        shortMessage.userId,
                        shortMessage.message
                    );
                    return;
                }

                // Handle regular messages
                if (update?.className?.includes('UpdateNewMessage') && update.message) {
                    const message = update.message;
                    
                    if (message.out) {
                        return;
                    }

                    // Get the sender's ID
                    let senderId = message.senderId?.toString();

                    if (!senderId && message.peerId) {
                        senderId = message.peerId.userId?.toString() ||
                                  message.peerId.chatId?.toString() ||
                                  message.peerId.channelId?.toString();
                    }

                    if (!senderId && message.fromId) {
                        senderId = message.fromId.userId?.toString();
                    }

                    if (!senderId) {
                        this.logger.error('Could not determine sender ID');
                        return;
                    }

                    this.logger.info('Received message:', {
                        text: message.message,
                        senderId: senderId
                    });

                    await this.handleIncomingMessage(
                        senderId,
                        message.message || ''
                    );
                }
            } catch (error) {
                this.logger.error('Error in event handler:', error);
            }
        });
    }

    private async handleIncomingMessage(userId: string, message: string) {
        try {
            this.logger.info(`New message from ${userId}`, { message: message.substring(0, 50) });
            
            // Add message to conversation context
            this.conversation.addMessage(userId, message);
            
            // Get conversation context
            const context = this.conversation.getContext(userId);
            
            // Generate AI response
            const response = await this.openai.generateResponse(message, context);
            
            // Add AI response to context and send it
            this.conversation.addMessage(userId, response);
            await this.telegram.sendMessage(userId, response);
            
        } catch (error: any) {
            this.logger.error('Error handling message', { error: error.message });
            await this.telegram.sendMessage(
                userId, 
                'Sorry, I encountered an error processing your message.'
            );
        }
    }
}

export default MessageHandler; 