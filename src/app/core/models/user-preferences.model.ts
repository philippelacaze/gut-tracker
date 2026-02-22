export type BodyMapGender = 'male' | 'female';
export type AppLanguage = 'fr' | 'en';
export type VoiceSttProvider = 'webSpeechApi' | 'whisper';

export interface UserPreferences {
  bodyMapGender: BodyMapGender;
  language: AppLanguage;
  voiceInputEnabled: boolean;
  voiceSttProvider: VoiceSttProvider;
}

export const USER_PREFERENCES_DEFAULT: UserPreferences = {
  bodyMapGender: 'male',
  language: 'fr',
  voiceInputEnabled: false,
  voiceSttProvider: 'webSpeechApi',
};
