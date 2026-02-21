import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { AiService } from '../../../../core/services/ai/ai.service';
import { AiError } from '../../../../core/services/ai/ai.error';
import { FoodCameraComponent, FoodCameraOutput } from './food-camera.component';

/** Helper : crée un Event de sélection de fichier simulé */
function makeFileEvent(file: File): Event {
  return {
    target: { files: [file], value: '' },
  } as unknown as Event;
}

/** Helper : mock FileReader qui appelle onload avec un dataUrl base64 */
function stubFileReader(dataUrl: string): () => void {
  const original = globalThis.FileReader;

  class MockFileReader {
    result: string = dataUrl;
    onload: ((e: ProgressEvent) => void) | null = null;
    onerror: ((e: ProgressEvent) => void) | null = null;
    readAsDataURL(): void {
      if (this.onload) this.onload({} as ProgressEvent);
    }
  }

  globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
  return () => {
    globalThis.FileReader = original;
  };
}

describe('FoodCameraComponent', () => {
  let fixture: ComponentFixture<FoodCameraComponent>;
  let component: FoodCameraComponent;
  let mockAiService: Partial<AiService>;

  const fakeResult = {
    foods: [{ name: 'Pomme', confidence: 0.95, quantity: '1' }],
    uncertain: [],
  };

  beforeEach(async () => {
    mockAiService = {
      analyzing: signal(false).asReadonly(),
      recognizeFood: vi.fn().mockResolvedValue(fakeResult),
      analyzeFodmap: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FoodCameraComponent],
      providers: [{ provide: AiService, useValue: mockAiService }],
    }).compileComponents();

    fixture = TestBed.createComponent(FoodCameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crée le composant', () => {
    expect(component).toBeTruthy();
  });

  it('previewUrl et error sont null à l\'initialisation', () => {
    expect(component.previewUrl()).toBeNull();
    expect(component.error()).toBeNull();
  });

  it('reset() efface previewUrl et error', () => {
    component['_previewUrl'].set('data:image/jpeg;base64,abc');
    component['_error'].set('une erreur');
    component.reset();
    expect(component.previewUrl()).toBeNull();
    expect(component.error()).toBeNull();
  });

  it('affiche les deux boutons d\'action avant la sélection', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.food-camera__btn');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('émet analysisComplete avec photoUrl et recognitionResult après analyse réussie', async () => {
    const restore = stubFileReader('data:image/jpeg;base64,dGVzdA==');
    const emitted: FoodCameraOutput[] = [];
    component.analysisComplete.subscribe((v: FoodCameraOutput) => emitted.push(v));

    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    await component.onFileSelected(makeFileEvent(file));

    await vi.waitFor(() => expect(emitted.length).toBe(1));
    expect(emitted[0].recognitionResult).toEqual(fakeResult);
    expect(emitted[0].photoUrl).toContain('data:image/jpeg;base64,');
    restore();
  });

  it('set error si recognizeFood lève une AiError de quota', async () => {
    const restore = stubFileReader('data:image/jpeg;base64,dGVzdA==');
    (mockAiService.recognizeFood as ReturnType<typeof vi.fn>).mockRejectedValue(
      new AiError('Quota dépassé', 'openai', true),
    );
    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    await component.onFileSelected(makeFileEvent(file));

    await vi.waitFor(() => expect(component.error()).toContain('Quota'));
    restore();
  });

  it('set error générique si recognizeFood lève une erreur inconnue', async () => {
    const restore = stubFileReader('data:image/jpeg;base64,dGVzdA==');
    (mockAiService.recognizeFood as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Erreur réseau'),
    );
    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    await component.onFileSelected(makeFileEvent(file));

    await vi.waitFor(() => expect(component.error()).toBe('Erreur réseau'));
    restore();
  });
});
