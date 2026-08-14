export interface ModelConfig {
  provider: 'openai' | 'nvidia' | 'groq';
  modelName: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsJSON: boolean;
  tier: 'fast' | 'reasoning' | 'low-cost';
}

export const ModelRegistry: Record<string, ModelConfig> = {
  'llama-3.1-70b-instruct': {
    provider: 'nvidia',
    modelName: 'meta/llama-3.1-70b-instruct',
    contextWindow: 128000,
    maxOutputTokens: 8000,
    supportsVision: false,
    supportsJSON: true,
    tier: 'reasoning',
  },
  'llama-3.3-70b-versatile': {
    provider: 'groq',
    modelName: 'llama-3.3-70b-versatile',
    contextWindow: 128000,
    maxOutputTokens: 8000,
    supportsVision: false,
    supportsJSON: true,
    tier: 'fast',
  }
};

export class ModelRegistryService {
  static getModelForIntent(intent: string): ModelConfig {
    // Basic routing logic
    if (intent === 'GenerateQuestionPaper' || intent === 'EvaluateTypedAnswer' || intent === 'GenerateQuestionExplanation') {
      return ModelRegistry['llama-3.1-70b-instruct']; // Needs deep reasoning, use NVIDIA
    }
    return ModelRegistry['llama-3.1-8b-instant']; // Fast fallback, use Groq
  }
}

