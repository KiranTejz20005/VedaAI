import OpenAI from 'openai';
import { AIProvider } from './provider.interface';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';

export class GroqProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ 
      apiKey: env.GROQ_API_KEY || '',
      baseURL: 'https://api.groq.com/openai/v1'
    });
  }

  async generate(prompt: string, options?: any, signal?: AbortSignal): Promise<any> {
    const model = options?.model || 'llama-3.1-70b-versatile';
    let messages: any[] = [{ role: 'user', content: prompt }];
    
    if (options?.media && options.media.length > 0) {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...options.media.map((m: any) => ({
            type: 'image_url',
            image_url: { url: m.url }
          }))
        ]
      }];
    }

    const response = await this.client.chat.completions.create({
      model,
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4096,
      response_format: options?.responseFormat,
    }, { signal });
    return response.choices[0].message.content;
  }

  async *stream(prompt: string, options?: any): AsyncIterable<any> {
    const model = options?.model || 'llama-3.1-70b-versatile';
    const stream = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: options?.temperature || 0.7,
    });

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  }

  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  supportsVision(): boolean {
    return false;
  }

  supportsJSON(): boolean {
    return true;
  }

  supportsStructuredOutput(): boolean {
    return true;
  }

  supportsFunctionCalling(): boolean {
    return true;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!env.GROQ_API_KEY) return false;
      await this.client.models.list();
      return true;
    } catch (e) {
      logger.error({ err: e }, 'Groq health check failed');
      return false;
    }
  }
}
