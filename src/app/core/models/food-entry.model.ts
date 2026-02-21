export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';

export interface FodmapScore {
  level: 'low' | 'medium' | 'high';
  /** Score de 0 à 10 */
  score: number;
  details: string;
  analyzedAt: string; // ISO date
}

export interface Food {
  id: string;
  name: string;
  /** null si pas encore analysé par l'IA */
  fodmapScore: FodmapScore | null;
  quantity?: string;
}

export interface FoodEntry {
  id: string;
  timestamp: string; // ISO date
  mealType: MealType;
  foods: Food[];
  /** base64 ou object URL */
  photoUrl?: string;
  globalFodmapScore?: FodmapScore;
  notes?: string;
}
