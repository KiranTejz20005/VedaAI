export interface AIProvider {
  generate(prompt: string, options?: any): Promise<any>;
  stream(prompt: string, options?: any): AsyncIterable<any>;
  countTokens(text: string): Promise<number>;
  supportsVision(): boolean;
  supportsJSON(): boolean;
  supportsStructuredOutput(): boolean;
  supportsFunctionCalling(): boolean;
  healthCheck(): Promise<boolean>;
}
