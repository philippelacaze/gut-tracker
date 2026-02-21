export class AiError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly isQuotaError: boolean = false,
  ) {
    super(message);
    this.name = 'AiError';
  }
}
