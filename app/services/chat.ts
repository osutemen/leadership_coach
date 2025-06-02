import OpenAI from 'openai';

interface ChatMessage {
    message: string;
    session_id?: string;
}

interface ConversationHistory {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

class LeadershipCoachService {
    private client: OpenAI;
    private conversationHistory: ConversationHistory[] = [];

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Initialize with system prompt
        this.conversationHistory.push({
            role: 'system',
            content: `Sen bir liderlim koçusun ve her zaman Türkçe konuşuyorsun. Amacın kullanıcılara liderlik becerilerini geliştirmede yardımcı olmak. 

Özellikle şu konularda uzmanlaştın:
- Takım yönetimi
- Karar verme süreçleri
- Kişisel gelişim
- Çatışma çözme
- Vizyon oluşturma
- Motivasyon ve etkili iletişim

Her zaman yapıcı, destekleyici ve pratik tavsiyelerde bulun. Somut örnekler ver ve kullanıcının durumuna özel çözümler öner.`
        });
    }

    async *chatStream(message: string): AsyncGenerator<string, void, unknown> {
        try {
            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                content: message
            });

            const stream = await this.client.chat.completions.create({
                model: 'gpt-4',
                messages: this.conversationHistory,
                stream: true,
                temperature: 0.6,
                max_tokens: 2048,
            });

            let responseContent = '';

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content;
                if (delta) {
                    responseContent += delta;
                    yield delta;
                }
            }

            // Add assistant response to history
            if (responseContent) {
                this.conversationHistory.push({
                    role: 'assistant',
                    content: responseContent
                });
            }

        } catch (error) {
            console.error('Error in chat stream:', error);
            yield `Bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`;
        }
    }

    resetConversation() {
        this.conversationHistory = [{
            role: 'system',
            content: `Sen bir liderlim koçusun ve her zaman Türkçe konuşuyorsun. Amacın kullanıcılara liderlik becerilerini geliştirmede yardımcı olmak. 

Özellikle şu konularda uzmanlaştın:
- Takım yönetimi
- Karar verme süreçleri
- Kişisel gelişim
- Çatışma çözme
- Vizyon oluşturma
- Motivasyon ve etkili iletişim

Her zaman yapıcı, destekleyici ve pratik tavsiyelerde bulun. Somut örnekler ver ve kullanıcının durumuna özel çözümler öner.`
        }];
    }

    getConversationHistory() {
        return this.conversationHistory;
    }
}

// Global instance for state management
const coachService = new LeadershipCoachService();

export async function getChatResponse(body: ChatMessage) {
    const { message } = body;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of coachService.chatStream(message)) {
                    // Format as SSE data
                    const sseData = `data: ${JSON.stringify({
                        chunk,
                        timestamp: Date.now(),
                        type: 'chunk'
                    })}\n\n`;

                    controller.enqueue(encoder.encode(sseData));
                }

                // Send completion signal
                const completionData = `data: ${JSON.stringify({
                    done: true,
                    timestamp: Date.now(),
                    type: 'completion'
                })}\n\n`;

                controller.enqueue(encoder.encode(completionData));
                controller.close();

            } catch (error) {
                console.error('Stream error:', error);
                const errorData = `data: ${JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error',
                    type: 'error'
                })}\n\n`;

                controller.enqueue(encoder.encode(errorData));
                controller.close();
            }
        }
    });

    return stream;
}

export function resetChat() {
    coachService.resetConversation();
    return { message: 'Conversation reset successfully' };
}

export function getChatHistory() {
    return { history: coachService.getConversationHistory() };
} 