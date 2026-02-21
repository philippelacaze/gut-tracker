import { InjectionToken } from '@angular/core';
import { FoodEntry } from '../models/food-entry.model';
import { Repository } from './repository.interface';

export const FOOD_ENTRY_REPOSITORY = new InjectionToken<Repository<FoodEntry>>(
  'FoodEntryRepository'
);
