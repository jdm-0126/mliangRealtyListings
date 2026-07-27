// lib/shared/financing/buildMortgageComputation.ts

import { PublicListing, TenantSettings } from "@/lib/shared/types/public";

interface MonthlyPayment {
  years: number;
  months: number;
  monthly: number;
  totalPaid: number;
  totalInterest: number;
}

export interface FinancingResult {
  totalPrice: number;
  equity: number;
  loanAmount: number;
  monthlyPayments: MonthlyPayment[];
  capped?: boolean;
}

export interface BuildMortgageComputationOptions {
  property: PublicListing;
  tenantSettings: TenantSettings;
  financing: FinancingResult;
  pagibig: FinancingResult | null;
  interestRate: number;
  pagibigRate: number;
}

const formatPHP = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export function buildMortgageComputation({
  property,
  tenantSettings,
  financing,
  pagibig,
  interestRate,
  pagibigRate,
}: BuildMortgageComputationOptions): string {
  const propertyId = property.property_id ?? 0;
  const displayId = propertyId > 2 ? propertyId - 1 : propertyId + 1;

  const buildOptions = (payments: MonthlyPayment[]) =>
    payments
      .map((payment) =>
        [
          `${payment.years} Years (${payment.months} months)`,
          `Monthly Payment : ${formatPHP(payment.monthly)}`,
          `Total Interest  : ${formatPHP(payment.totalInterest)}`,
          `Total Paid      : ${formatPHP(payment.totalPaid)}`,
        ].join("\n"),
      )
      .join("\n\n");

  const bankSection = [
    `BANK FINANCING (${interestRate}% p.a.)`,
    `Loan Amount : ${formatPHP(financing.loanAmount)}`,
    "",
    buildOptions(financing.monthlyPayments),
  ].join("\n");

  const pagibigSection = pagibig
    ? [
        "",
        `PAG-IBIG (${pagibigRate}% p.a.)`,
        `Loan Amount : ${formatPHP(pagibig.loanAmount)}${
          pagibig.capped ? " (capped at ₱6M)" : ""
        }`,
        "",
        buildOptions(pagibig.monthlyPayments),
      ].join("\n")
    : "";

  return [
    "MORTGAGE COMPUTATION",
    "==============================",
    "",
    `Property #${displayId}`,
    `${property.village ?? ""}${
      property.village ? ", " : ""
    }${property.location ?? ""}`,
    "",
    `Total Price : ${formatPHP(financing.totalPrice)}`,
    `20% Equity : ${formatPHP(financing.equity)}`,
    "",
    bankSection,
    pagibigSection,
    "",
    "* Based on diminishing balance amortization.",
    "* Actual rates and loan approval are subject to the bank or Pag-IBIG.",
    "",
    tenantSettings.businessName,
    tenantSettings.contactNumber,
    tenantSettings.emailAddress,
  ].join("\n");
}
