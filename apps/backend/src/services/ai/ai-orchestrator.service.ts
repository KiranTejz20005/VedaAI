import { ModelRegistryService } from './model-registry.service';
import { TokenBudgetService } from './token-budget.service';
import { PromptBuilderService } from './prompt-builder.service';
import { OpenAIProvider } from './providers/openai.provider';
import { GroqProvider } from './providers/groq.provider';
import { NvidiaProvider } from './providers/nvidia.provider';
import { AIProvider } from './providers/provider.interface';
import { ProviderHealthManager } from './provider-health';
import { withTimeout, createTimeoutSignal } from '../../utils/timeout';
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
  signal?: AbortSignal; // Optional upstream cancellation signal
}

const GENERATION_TIMEOUT_MS = 120_000;
// Fallback order used when the registry-selected provider fails.
const FALLBACK_ORDER: string[] = ['openai', 'groq', 'nvidia'];

export class AIOrchestrator {
  private static providers: Record<string, AIProvider> = {
    'openai': new OpenAIProvider(),
    'groq': new GroqProvider(),
    'nvidia': new NvidiaProvider()
  };

  // Circuit breaker over the live providers (reuses existing dead-code manager).
  private static health = new ProviderHealthManager();

  static async generate(options: AIRequestOptions): Promise<any> {
    try {
      // 1. Model Selection based on Intent
      const modelConfig = ModelRegistryService.getModelForIntent(options.intent);

      // 2. Token Budgeting & Context Compression
      const compressedContext = TokenBudgetService.truncateContextToFitBudget(
        options.context,
        modelConfig
      );

      // 3. Prompt Building
      let finalPrompt = PromptBuilderService.buildPrompt(
        options.intent,
        compressedContext,
        options.taskInstructions
      );

      // Handle JSON Schema fallback since some providers (like NVIDIA Llama endpoints) reject `json_schema`
      let finalResponseFormat = options.responseFormat;
      if (options.responseFormat?.type === 'json_schema') {
        const schemaString = JSON.stringify(options.responseFormat.json_schema.schema, null, 2);
        finalPrompt += `\n\nIMPORTANT: You must return ONLY valid JSON that precisely matches this JSON Schema:\n${schemaString}`;
        finalResponseFormat = { type: 'json_object' };
      }

      // 4. Execute via Provider Abstraction with multi-provider fallback.
      // The registry-selected provider is tried first; on failure we attempt
      // each remaining healthy provider once. A per-call AbortSignal timeout
      // guarantees a hung LLM call is actually aborted.
      const orderedProviders = [
        modelConfig.provider,
        ...FALLBACK_ORDER.filter((p) => p !== modelConfig.provider),
      ];

      let lastError: Error | null = null;

      for (const providerName of orderedProviders) {
        const provider = this.providers[providerName];
        if (!provider) continue;

        // Circuit breaker: skip providers currently tripped/open/quarantined.
        if (!this.health.canAttempt(providerName as any)) {
          logger.warn(`[AI_FALLBACK] Skipping ${providerName}: circuit open/quarantined`);
          continue;
        }

        // Use the registry model for the primary provider; let fallback
        // providers use their own sensible default model.
        const model = providerName === modelConfig.provider ? modelConfig.modelName : undefined;

        const signal = createTimeoutSignal(GENERATION_TIMEOUT_MS, options.signal);
        const t0 = Date.now();

        try {
          const result = await withTimeout(
            provider.generate(
              finalPrompt,
              {
                model,
                temperature: options.temperature,
                responseFormat: finalResponseFormat,
                media: options.media,
              },
              signal
            ),
            GENERATION_TIMEOUT_MS,
            `AI generation (${providerName})`,
            signal
          );

          this.health.recordSuccess(providerName as any, Date.now() - t0);

          // 5. Response Validation (assuming JSON here)
          if (modelConfig.supportsJSON) {
            try {
              // Some models wrap JSON in markdown blocks even when instructed not to
              let cleanResult = result;
              if (typeof result === 'string') {
                cleanResult = result.replace(/```json/gi, '').replace(/```/g, '').trim();
              }
              return JSON.parse(cleanResult);
            } catch (e) {
              logger.error({ result }, `Failed to parse AI response as JSON from ${providerName}`);
              this.health.recordValidationFailure(providerName as any);
              lastError = new Error('AI Response Validation Failed: Invalid JSON');
              continue; // try next provider
            }
          }

          return result;
        } catch (error) {
          lastError = error as Error;
          const duration = Date.now() - t0;
          logger.error(`[AI_FALLBACK] Provider ${providerName} failed after ${duration}ms: ${error}`);
          this.health.recordTransportFailure(providerName as any);
          // fall through to next provider
        }
      }

      throw new Error(
        `AI generation failed after trying providers [${orderedProviders.join(', ')}]. ` +
        `Last error: ${lastError?.message}`
      );
    } catch (error) {
      logger.error(`AIOrchestrator generation failed: ${error}`);
      throw error;
    }
  }
}
