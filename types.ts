
export interface InterestTier {
  startYear: number;
  endYear: number;
  rate: number; // Decimal (e.g., 0.0365)
}

export interface SimulationConfig {
  startDate: Date;
  initialBasicSalary: number;
  allowance: number;
  salaryGrowthRate: number; // Annual %
  expenseInflationRate: number; // Annual %
  initialMortgagePrincipal: number;
  initialTotalMonths: number;
  extraPaymentPenaltyRate: number; // % penalty per payment
  interestRateSchedule: InterestTier[];
}

export interface MonthRecord {
  monthIndex: number;
  date: Date;
  basicSalary: number;
  totalSalary: number;
  thr: number;
  compensation: number;
  totalIncome: number;
  thrExpense: number; // 50% of THR for special expenses
  thrToFunds: number; // 50% of THR for savings
  compToFunds: number; // 100% of Compensation for savings
  nonMortgageExpenses: number;
  mortgageInstallment: number;
  totalExpenses: number;
  excess: number;
  bufferBalance: number;
  emergencyBalance: number;
  extraPaymentBucket: number;
  extraPaymentPaid: number; // Raw amount submitted
  penaltyAmount: number; // Penalty deducted
  mortgageInterest: number;
  principalPaid: number;
  installmentBeforeExtra: number;
  installmentAfterExtra: number;
  installmentReduction: number;
  remainingPrincipal: number;
  interestRate: number;
  isRateChangeMonth: boolean;
}

export interface SummaryData {
  bufferFundedMonth: number | null;
  bufferFundedDate: string | null;
  emergencyFundedMonth: number | null;
  emergencyFundedDate: string | null;
  mortgagePaidMonth: number | null;
  mortgagePaidDate: string | null;
  totalInterestPaid: number;
  totalInterestBaseline: number;
  totalExtraPaidRaw: number;
  totalExtraPaidEffective: number;
  totalPenaltyPaid: number;
  totalSavings: number;
  minRuleDelayedPayoff: boolean;
  finalBufferBalance: number;
  finalEmergencyBalance: number;
}
