export interface AiProvider {
  readonly id: string;
  readonly name: string;
  readonly supportsVision: boolean;
  readonly isFree: boolean;
  readonly supportsAudioTranscription: boolean;

  analyzeImage(base64Image: string, prompt: string, fileType: string): Promise<string>;
  complete(prompt: string, systemPrompt?: string): Promise<string>;
  transcribeAudio?(audioBlob: Blob, language: string): Promise<string>;
}
