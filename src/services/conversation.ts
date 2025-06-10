import { Logger } from '../utils/logger';

interface ConversationContext {
    messages: string[];
    lastInteraction: Date;
}

export class ConversationService {
    private contexts: Map<string, ConversationContext>;
    private logger: Logger;
    private readonly MAX_CONTEXT_LENGTH = 10;
    private readonly CONTEXT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    constructor() {
        this.contexts = new Map();
        this.logger = new Logger('ConversationService');
    }

    addMessage(userId: string, message: string) {
        const context = this.getOrCreateContext(userId);
        context.messages.push(message);
        context.lastInteraction = new Date();

        // Keep only the last MAX_CONTEXT_LENGTH messages
        if (context.messages.length > this.MAX_CONTEXT_LENGTH) {
            context.messages = context.messages.slice(-this.MAX_CONTEXT_LENGTH);
        }

        this.contexts.set(userId, context);
        this.logger.info(`Added message to conversation for user ${userId}`);
    }

    getContext(userId: string): string[] {
        const context = this.contexts.get(userId);
        if (!context) return [];

        // Check if context has expired
        if (this.hasContextExpired(context.lastInteraction)) {
            this.clearContext(userId);
            return [];
        }

        return context.messages;
    }

    clearContext(userId: string) {
        this.contexts.delete(userId);
        this.logger.info(`Cleared conversation context for user ${userId}`);
    }

    private getOrCreateContext(userId: string): ConversationContext {
        const existing = this.contexts.get(userId);
        if (existing && !this.hasContextExpired(existing.lastInteraction)) {
            return existing;
        }

        return {
            messages: [],
            lastInteraction: new Date()
        };
    }

    private hasContextExpired(lastInteraction: Date): boolean {
        const now = new Date();
        return now.getTime() - lastInteraction.getTime() > this.CONTEXT_TIMEOUT_MS;
    }
}

export default ConversationService; 