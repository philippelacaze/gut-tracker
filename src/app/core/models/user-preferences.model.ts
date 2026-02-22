export type BodyMapGender = 'male' | 'female';
export type AppLanguage = 'fr' | 'en';

export interface UserPreferences {
  bodyMapGender: BodyMapGender;
  language: AppLanguage;
}

export const USER_PREFERENCES_DEFAULT: UserPreferences = {
  bodyMapGender: 'male',
  language: 'fr',
};
