
export const INITIAL_AVG_MORTGAGE_INSTALLMENT = 5285888;

export const MORTGAGE_SCHEDULE = [
  { years: [1, 3], rate: 0.0365, baseInstallment: 3708369 },
  { years: [4, 6], rate: 0.0765, baseInstallment: 4940831 },
  { years: [7, 10], rate: 0.0965, baseInstallment: 5529354 },
  { years: [11, 20], rate: 0.1065, baseInstallment: 5765273 },
];

export const INITIAL_NON_MORTGAGE_EXPENSES = 6328000; // Calculated from itemized list provided

export const BASE_START_DATE = new Date(2026, 0, 1); // January 2026
