import { ModelRegistryService } from './model-registry.service';
import { TokenBudgetService } from './token-budget.service';
import { PromptBuilderService } from './prompt-builder.service';
import { OpenAIProvider } from './providers/openai.provider';
import { GroqProvider } from './providers/groq.provider';
import { NvidiaProvider } from './providers/nvidia.provider';
import { AIProvider } from './providers/provider.interface';
import { logger } from '../../utils/logger';

export interface AIRequestOptions {
  intent: string;
  context: string;
  taskInstructions: string;
  responseFormat?: any; // e.g., JSON Schema
  temperature?: number;
  media?: {
    type: 'image_url';
    url: string; // Base64 or actual URL
  }[];
}

export class AIOrchestrator {
  private static providers: Record<string, AIProvider> = {
    'openai': new OpenAIProvider(),
    'groq': new GroqProvider(),
    'nvidia': new NvidiaProvider()
  };

  static async generate(options: AIRequestOptions): Promise<any> {
    try {
      // 1. Model Selection based on Intent
      const modelConfig = ModelRegistryService.getModelForIntent(options.intent);
      const provider = this.providers[modelConfig.provider];
      
      if (!provider) {
        throw new Error(`Provider ${modelConfig.provider} is not configured.`);
      }

      // 2. Token Budgeting & Context Compression
      const compressedContext = TokenBudgetService.truncateContextToFitBudget(
        options.context, 
        modelConfig
      );

      // 3. Prompt Building
      const finalPrompt = PromptBuilderService.buildPrompt(
        options.intent,
        compressedContext,
        options.taskInstructions
      );

      // 4. Execute via Provider Abstraction
      const result = await provider.generate(finalPrompt, {
        model: modelConfig.modelName,
        temperature: options.temperature,
        responseFormat: options.responseFormat,
        media: options.media,
      });

      // 5. Response Validation (assuming JSON here)
      // If we requested JSON, attempt to parse it. 
      // If it fails, we log it and throw.
      if (modelConfig.supportsJSON) {
        try {
          // Some models wrap JSON in markdown blocks even when instructed not to
          let cleanResult = result;
          if (typeof result === 'string') {
            cleanResult = result.replace(/```json/gi, '').replace(/```/g, '').trim();
          }
          return JSON.parse(cleanResult);
        } catch (e) {
          logger.error({ result }, 'Failed to parse AI response as JSON');
          throw new Error('AI Response Validation Failed: Invalid JSON');
        }
      }

      return result;
    } catch (error) {
      logger.error(`AIOrchestrator generation failed: ${error}`);
      throw error;
    }
  }
}
