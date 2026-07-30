// lib/shared/utils/financing.ts

import { FinancingResult} from "@/lib/shared/types/public"

export function calculateBankFinancing(
  price: number,
  interestRate: number,
  customPrice?: number
): FinancingResult {
  const downPayment = customPrice ?? price;

  const equity = downPayment * 0.2;
  const rawMortgage = price - equity;
  const loanAmount = rawMortgage;

  const terms = [5, 10, 15, 20, 25, 30];

  const monthlyPayments = terms.map((years) => {
    const months = years * 12;
    const monthlyRate = interestRate / 100 / 12;

    const monthly =
      monthlyRate === 0
        ? loanAmount / months
        : (loanAmount *
            monthlyRate *
            Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);

    const totalPaid = monthly * months;
    const totalInterest = totalPaid - loanAmount;

    return {
      years,
      months,
      monthly,
      totalPaid,
      totalInterest,
    };
  });

  return {
    totalPrice: price,
    equity,
    loanAmount,
    rawMortgage,
    monthlyPayments,
  };
}

export function calculatePagibigFinancing(
  price: number,
  interestRate: number,
  customPrice?: number
): FinancingResult {
  const downPayment = customPrice ?? price;

  const equity = downPayment * 0.2;
  const rawMortgage = price - equity;

  const loanAmount = Math.min(rawMortgage, 6_000_000);

  const terms = [5, 10, 15, 20, 25, 30];

  const monthlyPayments = terms.map((years) => {
    const months = years * 12;
    const monthlyRate = interestRate / 100 / 12;

    const monthly =
      monthlyRate === 0
        ? loanAmount / months
        : (loanAmount *
            monthlyRate *
            Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);

    const totalPaid = monthly * months;
    const totalInterest = totalPaid - loanAmount;

    return {
      years,
      months,
      monthly,
      totalPaid,
      totalInterest,
    };
  });

  return {
    totalPrice: price,
    equity,
    loanAmount,
    rawMortgage,
    monthlyPayments,
  };
}

export function formatPHP(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}