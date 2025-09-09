import { MealType } from '../types';

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Café da Manhã',
  lunch: 'Almoço',
  afternoon_snack: 'Café da Tarde',
  snack: 'Lanche',
  dinner: 'Janta',
  correction: 'Correção',
};

export const MEAL_LABELS_SHORT: Record<MealType, string> = {
  breakfast: 'Café',
  lunch: 'Almoço',
  afternoon_snack: 'Tarde',
  snack: 'Lanche',
  dinner: 'Janta',
  correction: 'Correção',
};

export const MEAL_ICONS: Record<MealType, string> = {
  breakfast: 'coffee-outline',
  lunch: 'silverware',
  afternoon_snack: 'coffee',
  snack: 'food-outline',
  dinner: 'silverware',
  correction: 'medication-outline',
};
