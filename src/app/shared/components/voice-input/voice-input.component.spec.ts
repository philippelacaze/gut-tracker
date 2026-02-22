import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { VoiceParseResult } from '../../../core/models/voice-entry.model';
import { VoiceEntryParserService } from '../../../core/services/voice/voice-entry-parser.service';
import { VoiceRecognitionService } from '../../../core/services/voice/voice-recognition.service';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';
import { VoiceInputComponent } from './voice-input.component';

describe('VoiceInputComponent', () => {
  const mockResult: VoiceParseResult = {
    context: 'food',
    transcript: 'pomme',
    data: { mealType: 'lunch', foods: [{ name: 'pomme', quantity: null }], notes: null },
  };

  // Résolution contrôlée pour le résultat STT
  let resolveRecording!: (transcript: string) => void;

  const mockRecognitionService = {
    isWebSpeechSupported: true,
    startRecording: vi.fn(() => ({
      result: new Promise<string>(resolve => {
        resolveRecording = resolve;
      }),
      stop: vi.fn(),
    })),
  };

  const mockParserService = {
    parse: vi.fn().mockResolvedValue(mockResult),
  };

  const mockPrefsService = {
    preferences: signal({
      bodyMapGender: 'male',
      language: 'fr',
      voiceInputEnabled: true,
      voiceSttProvider: 'webSpeechApi',
    }),
  };

  async function createComponent(voiceEnabled = true) {
    mockPrefsService.preferences = signal({
      bodyMapGender: 'male',
      language: 'fr',
      voiceInputEnabled: voiceEnabled,
      voiceSttProvider: 'webSpeechApi',
    } as const);

    await TestBed.configureTestingModule({
      imports: [VoiceInputComponent],
      providers: [
        { provide: VoiceRecognitionService, useValue: mockRecognitionService },
        { provide: VoiceEntryParserService, useValue: mockParserService },
        { provide: UserPreferencesService, useValue: mockPrefsService },
      ],
    }).compileComponents();

    const fixture: ComponentFixture<VoiceInputComponent> = TestBed.createComponent(VoiceInputComponent);
    fixture.componentRef.setInput('context', 'food');
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le FAB quand voiceInputEnabled est vrai', async () => {
    const fixture = await createComponent(true);
    const fab = fixture.nativeElement.querySelector('.voice-input__fab');
    expect(fab).not.toBeNull();
  });

  it('cache le FAB quand voiceInputEnabled est faux', async () => {
    const fixture = await createComponent(false);
    const fab = fixture.nativeElement.querySelector('.voice-input__fab');
    expect(fab).toBeNull();
  });

  it('passe à l\'état recording au clic sur le FAB', async () => {
    const fixture = await createComponent();
    const fab = fixture.nativeElement.querySelector('.voice-input__fab') as HTMLButtonElement;
    fab.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.voiceState()).toBe('recording');
  });

  it('affiche l\'overlay quand l\'état n\'est pas idle', async () => {
    const fixture = await createComponent();
    const fab = fixture.nativeElement.querySelector('.voice-input__fab') as HTMLButtonElement;
    fab.click();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.voice-input__overlay');
    expect(overlay).not.toBeNull();
  });

  it('passe à done après résolution du transcript STT', async () => {
    const fixture = await createComponent();
    const fab = fixture.nativeElement.querySelector('.voice-input__fab') as HTMLButtonElement;
    fab.click();
    fixture.detectChanges();

    // Simule la fin de l'enregistrement
    resolveRecording('pomme et riz');
    await vi.waitFor(() => {
      expect(fixture.componentInstance.voiceState()).toBe('done');
    });
    expect(fixture.componentInstance.transcript()).toBe('pomme et riz');
  });

  it('émet parseResultReady après analyse', async () => {
    const fixture = await createComponent();
    const emitted: VoiceParseResult[] = [];
    fixture.componentInstance.parseResultReady.subscribe(v => emitted.push(v));

    // Démarrer → transcript prêt
    fixture.nativeElement.querySelector('.voice-input__fab').click();
    fixture.detectChanges();
    resolveRecording('pomme');
    await vi.waitFor(() => expect(fixture.componentInstance.voiceState()).toBe('done'));

    // Cliquer Analyser
    fixture.detectChanges();
    const analyseBtn = fixture.nativeElement.querySelector(
      '.voice-input__btn--primary',
    ) as HTMLButtonElement;
    analyseBtn.click();

    await vi.waitFor(() => expect(emitted).toHaveLength(1));
    expect(emitted[0].context).toBe('food');
    expect(fixture.componentInstance.voiceState()).toBe('idle');
  });

  it('émet cancelled et revient à idle sur Annuler', async () => {
    const fixture = await createComponent();
    const cancelledEvents: void[] = [];
    const sub = fixture.componentInstance.cancelled.subscribe(() => cancelledEvents.push(undefined));

    fixture.nativeElement.querySelector('.voice-input__fab').click();
    fixture.detectChanges();
    resolveRecording('test');
    await vi.waitFor(() => expect(fixture.componentInstance.voiceState()).toBe('done'));
    fixture.detectChanges();

    // Appel direct pour éviter les problèmes de timing DOM avec OnPush
    fixture.componentInstance.cancel();
    fixture.detectChanges();

    expect(cancelledEvents).toHaveLength(1);
    expect(fixture.componentInstance.voiceState()).toBe('idle');
    sub.unsubscribe();
  });

  it('aria-label du FAB change selon l\'état', async () => {
    const fixture = await createComponent();
    const fab = fixture.nativeElement.querySelector('.voice-input__fab') as HTMLButtonElement;

    // État idle
    expect(fab.getAttribute('aria-label')).toContain('Démarrer');

    // État recording
    fab.click();
    fixture.detectChanges();
    expect(fab.getAttribute('aria-label')).toContain('Arrêter');
  });

  it('passe en état error et revient automatiquement à idle', async () => {
    vi.useFakeTimers();
    mockRecognitionService.startRecording.mockImplementationOnce(() => {
      throw new Error('Microphone inaccessible');
    });

    const fixture = await createComponent();
    fixture.nativeElement.querySelector('.voice-input__fab').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.voiceState()).toBe('error');

    vi.advanceTimersByTime(3_000);
    fixture.detectChanges();
    expect(fixture.componentInstance.voiceState()).toBe('idle');

    vi.useRealTimers();
  });
});
