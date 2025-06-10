import OpenAI from 'openai';
import { Logger } from '../utils/logger';

export class OpenAIService {
    private client: OpenAI;
    private logger: Logger;

    constructor() {
        this.logger = new Logger('OpenAIService');
        this.client = new OpenAI({
            baseURL: "https://api.llm7.io/v1",
            apiKey: "unused"
        });
    }

    async generateResponse(prompt: string, context: string[] = []): Promise<string> {
        try {
            const messages = context.map(msg => ({ 
                role: 'user' as const, 
                content: msg 
            }));
            messages.push({ role: 'user', content: prompt });

            const completion = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                temperature: 0.7,
                max_tokens: 500
            });

            return completion.choices[0]?.message?.content || '';
        } catch (error: any) {
            this.logger.error('AI response error', { error: error.message });
            return 'Sorry, I am having trouble processing your request right now.';
        }
    }
}

export default OpenAIService; 