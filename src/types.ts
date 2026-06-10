export interface FinancialData {
  salary: number;
  monthlyInvestment: number; // 20%
  shortTermGoal: number; // 6x salary
  longTermGoal: number; // 93x salary
  variableExpenses: number; // 30%
  fixedExpenses: number; // 50%
}

export interface UserPreferences {
  darkMode: boolean;
  language: "pt" | "en";
  biometricsEnabled: boolean;
  twoFactorEnabled: boolean;
  bankConnected: boolean;
  wearableConnected: boolean;
}

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  date: string;
}
