import { TestBed } from '@angular/core/testing';

import { USER_PREFERENCES_DEFAULT, UserPreferences } from '../models/user-preferences.model';
import { UserPreferencesService } from './user-preferences.service';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserPreferencesService);
  });

  describe('état initial', () => {
    it('devrait retourner les préférences par défaut si aucune stockée', () => {
      expect(service.preferences().bodyMapGender).toBe(USER_PREFERENCES_DEFAULT.bodyMapGender);
      expect(service.preferences().language).toBe(USER_PREFERENCES_DEFAULT.language);
    });
  });

  describe('save()', () => {
    it('devrait mettre à jour le signal après sauvegarde', () => {
      const updated: UserPreferences = { bodyMapGender: 'female', language: 'en' };

      service.save(updated);

      expect(service.preferences().bodyMapGender).toBe('female');
      expect(service.preferences().language).toBe('en');
    });

    it('devrait persister en localStorage', () => {
      const updated: UserPreferences = { bodyMapGender: 'female', language: 'en' };

      service.save(updated);

      const raw = localStorage.getItem('gt_user_preferences')!;
      expect(JSON.parse(raw)).toMatchObject(updated);
    });

    it('devrait recharger les préférences depuis localStorage au démarrage', () => {
      const stored: UserPreferences = { bodyMapGender: 'female', language: 'en' };
      localStorage.setItem('gt_user_preferences', JSON.stringify(stored));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const fresh = TestBed.inject(UserPreferencesService);

      expect(fresh.preferences().bodyMapGender).toBe('female');
      expect(fresh.preferences().language).toBe('en');
    });

    it('devrait retourner les valeurs par défaut si le localStorage est corrompu', () => {
      localStorage.setItem('gt_user_preferences', 'données-invalides-JSON{{{');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const fresh = TestBed.inject(UserPreferencesService);

      expect(fresh.preferences().bodyMapGender).toBe(USER_PREFERENCES_DEFAULT.bodyMapGender);
    });
  });
});
