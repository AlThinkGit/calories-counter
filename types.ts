
export interface FoodCalorieInfo {
  foodItem: string;
  caloriesPerItem: number;
  quantity: number;
  servingSize: string;
  likelyIngredients: string[];
  preparationStyle: string;
  nutritionNotes: string;
}

export interface FoodEntry extends FoodCalorieInfo {
  id: string;
  addedAt: string;
}

export interface DailyLog {
  date: string;
  memberId: string;
  totalCalories: number;
  entries: FoodEntry[];
}

export type WeightGoal = "lose" | "maintain" | "gain";
export type BiologicalSex = "female" | "male";
export type ActivityLevel = "low" | "moderate" | "high";

export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  weightGoal: WeightGoal;
  suggestedDailyCalories: number;
  customDailyGoal?: number;
  useSuggestedGoal: boolean;
}

export interface UserProfile {
  displayName: string;
  members: FamilyMember[];
  activeMemberId: string | null;
}
