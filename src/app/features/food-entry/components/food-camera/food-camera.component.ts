import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';

import {
  ImageRecognitionResult,
} from '../../../../core/models/ai-recognition.model';
import { AiService } from '../../../../core/services/ai/ai.service';
import { AiError } from '../../../../core/services/ai/ai.error';

export interface FoodCameraOutput {
  photoUrl: string;
  recognitionResult: ImageRecognitionResult;
}

@Component({
  selector: 'gt-food-camera',
  standalone: true,
  imports: [],
  templateUrl: './food-camera.component.html',
  styleUrl: './food-camera.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodCameraComponent {
  private readonly _aiService = inject(AiService);

  private readonly _previewUrl = signal<string | null>(null);
  private readonly _error = signal<string | null>(null);

  readonly previewUrl = this._previewUrl.asReadonly();
  readonly error = this._error.asReadonly();
  readonly analyzing = this._aiService.analyzing;

  readonly analysisComplete = output<FoodCameraOutput>();

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this._error.set(null);
    const base64 = await this._readFileAsBase64(file);
    this._previewUrl.set(`data:${file.type};base64,${base64}`);
    // Réinitialise l'input pour permettre la resélection du même fichier
    input.value = '';

    await this._analyze(base64);
  }

  reset(): void {
    this._previewUrl.set(null);
    this._error.set(null);
  }

  private _readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async _analyze(base64: string): Promise<void> {
    try {
      const result = await this._aiService.recognizeFood(base64);
      this.analysisComplete.emit({ photoUrl: this._previewUrl()!, recognitionResult: result });
    } catch (err: unknown) {
      if (err instanceof AiError && err.isQuotaError) {
        this._error.set($localize`:@@foodCamera.error.quota:Quota dépassé. Vérifiez vos paramètres IA.`);
      } else {
        this._error.set(
          err instanceof Error
            ? err.message
            : $localize`:@@foodCamera.error.analysis:Erreur lors de l'analyse.`,
        );
      }
    }
  }
}
