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
  'gpt-4o-mini': {
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    contextWindow: 128000,
    maxOutputTokens: 16000,
    supportsVision: true,
    supportsJSON: true,
    tier: 'fast',
  },
  'gpt-4o': {
    provider: 'openai',
    modelName: 'gpt-4o',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsVision: true,
    supportsJSON: true,
    tier: 'reasoning',
  },
  // Stubbed out for future Nvidia NIM / Groq integrations
  'llama-3.1-70b-instruct': {
    provider: 'groq',
    modelName: 'llama-3.1-70b-versatile',
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
    if (intent === 'GenerateQuestionPaper' || intent === 'EvaluateTypedAnswer') {
      return ModelRegistry['gpt-4o']; // Needs deep reasoning
    }
    return ModelRegistry['gpt-4o-mini']; // Fast fallback
  }
}
