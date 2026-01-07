
import { SimulationConfig, MonthRecord, SummaryData, InterestTier } from '../types';
import { INITIAL_AVG_MORTGAGE_INSTALLMENT, INITIAL_NON_MORTGAGE_EXPENSES } from '../constants';

/**
 * Dynamic Annuity Formula (PMT):
 * C_new = P_remain * [ r_monthly * (1 + r_monthly)^n_remain ] / [ (1 + r_monthly)^n_remain - 1 ]
 */
export const calculatePMT = (principal: number, annualRate: number, monthsRemaining: number): number => {
  if (principal <= 0 || monthsRemaining <= 0) return 0;
  if (annualRate === 0) return principal / monthsRemaining;
  const r = annualRate / 12;
  const power = Math.pow(1 + r, monthsRemaining);
  return principal * (r * power) / (power - 1);
};

const getTierForYear = (year: number, schedule: InterestTier[]): InterestTier => {
  return schedule.find(tier => year >= tier.startYear && year <= tier.endYear) 
         || schedule[schedule.length - 1];
};

/**
 * Baseline calculation (No Acceleration) to determine total interest for comparison.
 */
const calculateBaselineInterest = (config: SimulationConfig): number => {
  let principal = config.initialMortgagePrincipal;
  let totalInterest = 0;
  const schedule = config.interestRateSchedule;
  const totalMonthsTenor = config.initialTotalMonths;
  let currentInstallment = calculatePMT(principal, schedule[0].rate, totalMonthsTenor);

  for (let m = 0; m < totalMonthsTenor; m++) {
    const yearNum = Math.floor(m / 12) + 1;
    const scheduleTier = getTierForYear(yearNum, schedule);
    
    if (m > 0 && m % 12 === 0) {
        const prevYearNum = Math.floor((m - 1) / 12) + 1;
        const prevTier = getTierForYear(prevYearNum, schedule);
        if (prevTier.rate !== scheduleTier.rate) {
          currentInstallment = calculatePMT(principal, scheduleTier.rate, totalMonthsTenor - m);
        }
    }

    const monthlyInterest = principal * (scheduleTier.rate / 12);
    totalInterest += monthlyInterest;
    const principalPaid = Math.min(principal, Math.max(0, currentInstallment - monthlyInterest));
    principal -= principalPaid;
    if (principal <= 0) break;
  }
  return totalInterest;
};

export const runSimulation = (config: SimulationConfig): { records: MonthRecord[], summary: SummaryData } => {
  const records: MonthRecord[] = [];
  const baselineInterest = calculateBaselineInterest(config);
  const schedule = config.interestRateSchedule;
  
  let currentPrincipal = config.initialMortgagePrincipal;
  let currentBasicSalary = config.initialBasicSalary;
  let currentNonMortgageExpenses = INITIAL_NON_MORTGAGE_EXPENSES;
  let bufferBalance = 0;
  let emergencyBalance = 0;
  let extraPaymentBucket = 0;
  
  let bufferFundedMonth: number | null = null;
  let emergencyFundedMonth: number | null = null;
  let mortgagePaidMonth: number | null = null;
  
  let totalInterestPaid = 0;
  let totalExtraPaidRaw = 0;
  let totalExtraPaidEffective = 0;
  let totalPenaltyPaid = 0;
  let minRuleDelayedPayoff = false;

  const totalMonthsTenor = config.initialTotalMonths;
  let currentInstallment = calculatePMT(currentPrincipal, schedule[0].rate, totalMonthsTenor);

  for (let m = 0; m < 480; m++) {
    const currentMonthDate = new Date(config.startDate);
    currentMonthDate.setMonth(currentMonthDate.getMonth() + m);
    
    const yearNum = Math.floor(m / 12) + 1;
    const monthInYear = m % 12;
    let isRateChangeMonth = false;

    if (m > 0 && monthInYear === 0) {
      currentBasicSalary *= (1 + config.salaryGrowthRate / 100);
      currentNonMortgageExpenses *= (1 + config.expenseInflationRate / 100);
    }

    const scheduleTier = getTierForYear(yearNum, schedule);
    const currentRate = scheduleTier.rate;

    if (monthInYear === 0 && m > 0) {
      const prevYearNum = Math.floor((m - 1) / 12) + 1;
      const prevTier = getTierForYear(prevYearNum, schedule);
      if (prevTier.rate !== currentRate && currentPrincipal > 0) {
        currentInstallment = calculatePMT(currentPrincipal, currentRate, totalMonthsTenor - m);
        isRateChangeMonth = true;
      }
    }

    // Special Income Months
    const thr = (monthInYear === 2) ? currentBasicSalary : 0; // March
    const compensation = (monthInYear === 3) ? currentBasicSalary : 0; // April
    
    // THR Logic: 50% for special expenses, 50% for funds
    const thrExpense = thr * 0.5;
    const thrToFunds = thr * 0.5;
    
    // Compensation Logic: 100% for funds
    const compToFunds = compensation;

    const totalIncome = (currentBasicSalary + config.allowance) + thr + compensation;

    // Apply Yearly Extra Payment
    let extraPaidRaw = 0;
    let penaltyAmount = 0;
    let effectiveExtra = 0;
    let instBefore = currentInstallment;

    if (monthInYear === 0 && m >= 12 && extraPaymentBucket > 0 && currentPrincipal > 0) {
      const minExtraRequired = 6 * currentInstallment;
      const isEligible = extraPaymentBucket >= minExtraRequired || currentPrincipal < minExtraRequired;
      
      if (isEligible) {
        const amountNeededToFinish = currentPrincipal / (1 - (config.extraPaymentPenaltyRate / 100));
        extraPaidRaw = Math.min(extraPaymentBucket, amountNeededToFinish);
        penaltyAmount = extraPaidRaw * (config.extraPaymentPenaltyRate / 100);
        effectiveExtra = extraPaidRaw - penaltyAmount;
        
        currentPrincipal -= effectiveExtra;
        extraPaymentBucket -= extraPaidRaw;
        
        totalExtraPaidRaw += extraPaidRaw;
        totalPenaltyPaid += penaltyAmount;
        totalExtraPaidEffective += effectiveExtra;

        if (currentPrincipal > 0) {
          currentInstallment = calculatePMT(currentPrincipal, currentRate, totalMonthsTenor - m);
        } else {
          currentInstallment = 0;
        }
      } else {
        minRuleDelayedPayoff = true;
      }
    }

    const currentRoutineExpenses = currentNonMortgageExpenses + currentInstallment;
    // Surplus from regular salary + allowance after routine expenses
    const regularExcess = (currentBasicSalary + config.allowance) - currentRoutineExpenses;
    
    // Total available for prioritization: Regular Surplus + 50% THR + 100% Compensation
    // THR Expense (50%) is ignored here as it's assumed spent.
    let totalFundAvailable = regularExcess + thrToFunds + compToFunds;

    const bufferTarget = (3 * currentNonMortgageExpenses) + INITIAL_AVG_MORTGAGE_INSTALLMENT;
    const emergencyTarget = (12 * currentNonMortgageExpenses) + (12 * INITIAL_AVG_MORTGAGE_INSTALLMENT);

    // Prioritization: Buffer -> Emergency -> Extra
    if (totalFundAvailable > 0) {
      // 1. Buffer
      if (bufferBalance < bufferTarget) {
        const allocate = Math.min(totalFundAvailable, bufferTarget - bufferBalance);
        bufferBalance += allocate;
        totalFundAvailable -= allocate;
        if (bufferBalance >= bufferTarget && bufferFundedMonth === null) bufferFundedMonth = m + 1;
      }
      
      // 2. Emergency
      if (totalFundAvailable > 0 && emergencyBalance < emergencyTarget) {
        const allocate = Math.min(totalFundAvailable, emergencyTarget - emergencyBalance);
        emergencyBalance += allocate;
        totalFundAvailable -= allocate;
        if (emergencyBalance >= emergencyTarget && emergencyFundedMonth === null) emergencyFundedMonth = m + 1;
      }
      
      // 3. Extra Bucket
      if (totalFundAvailable > 0) {
        extraPaymentBucket += totalFundAvailable;
        totalFundAvailable = 0;
      }
    }

    const monthlyInterest = currentPrincipal * (currentRate / 12);
    let principalFromInst = Math.min(currentPrincipal, Math.max(0, currentInstallment - monthlyInterest));
    
    totalInterestPaid += monthlyInterest;
    currentPrincipal -= principalFromInst;

    records.push({
      monthIndex: m + 1,
      date: currentMonthDate,
      basicSalary: currentBasicSalary,
      totalSalary: currentBasicSalary + config.allowance,
      thr,
      compensation,
      totalIncome,
      thrExpense,
      thrToFunds,
      compToFunds,
      nonMortgageExpenses: currentNonMortgageExpenses,
      mortgageInstallment: currentInstallment, 
      totalExpenses: currentRoutineExpenses + thrExpense,
      excess: totalIncome - (currentRoutineExpenses + thrExpense),
      bufferBalance,
      emergencyBalance,
      extraPaymentBucket,
      extraPaymentPaid: extraPaidRaw,
      penaltyAmount,
      mortgageInterest: monthlyInterest,
      principalPaid: principalFromInst,
      installmentBeforeExtra: instBefore,
      installmentAfterExtra: currentInstallment,
      installmentReduction: Math.max(0, instBefore - currentInstallment),
      remainingPrincipal: currentPrincipal,
      interestRate: currentRate,
      isRateChangeMonth
    });

    if (currentPrincipal <= 0) {
      mortgagePaidMonth = m + 1;
      break;
    }
  }

  const getAchievedDate = (mIdx: number | null) => {
    if (!mIdx) return null;
    const d = new Date(config.startDate);
    d.setMonth(d.getMonth() + mIdx - 1);
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  return {
    records,
    summary: {
      bufferFundedMonth,
      bufferFundedDate: getAchievedDate(bufferFundedMonth),
      emergencyFundedMonth,
      emergencyFundedDate: getAchievedDate(emergencyFundedMonth),
      mortgagePaidMonth,
      mortgagePaidDate: getAchievedDate(mortgagePaidMonth),
      totalInterestPaid,
      totalInterestBaseline: baselineInterest,
      totalExtraPaidRaw,
      totalExtraPaidEffective,
      totalPenaltyPaid,
      totalSavings: Math.max(0, baselineInterest - totalInterestPaid),
      minRuleDelayedPayoff,
      finalBufferBalance: bufferBalance,
      finalEmergencyBalance: emergencyBalance
    }
  };
};
