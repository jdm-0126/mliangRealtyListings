// hooks/useFinancing.ts

"use client";

import { useMemo, useState } from "react";
import { PublicListing, TenantSettings } from "@/lib/shared/types/public";
import { buildMortgageComputation } from "@/lib/shared/financing/buildMortgageComputation";

interface UseFinancingProps {
  property: PublicListing | null;
  tenantSettings: TenantSettings | null;
  customPrice?: number;
}

export function useFinancing({
  property,
  tenantSettings,
  customPrice,
}: UseFinancingProps) {
  const [interestRate, setInterestRate] = useState(8);
  const [pagibigRate, setPagibigRate] = useState(6.5);

  const [financingMode, setFinancingMode] = useState<
    "bank" | "pagibig"
  >("bank");

  const financing = useMemo(() => {
    if (!property) return null;

    const price =
      customPrice ??
      Number(property.price);

    if (!price || Number.isNaN(price)) return null;

    const equity = price * 0.2;
    const loanAmount = price * 0.8;

    const terms = [5, 10, 15, 20];

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

      return {
        years,
        months,
        monthly,
        totalPaid: monthly * months,
        totalInterest:
          monthly * months - loanAmount,
      };
    });

    return {
      totalPrice: price,
      equity,
      loanAmount,
      monthlyPayments,
    };
  }, [property, customPrice, interestRate]);

  const pagibig = useMemo(() => {
    if (!property) return null;

    const price =
      customPrice ??
      Number(property.price);

    if (!price || Number.isNaN(price)) return null;

    const equity = price * 0.2;

    const rawLoan = price * 0.8;
    const loanAmount = Math.min(rawLoan, 6_000_000);

    const terms = [5, 10, 15, 20, 25, 30];

    const monthlyPayments = terms.map((years) => {
      const months = years * 12;
      const monthlyRate = pagibigRate / 100 / 12;

      const monthly =
        monthlyRate === 0
          ? loanAmount / months
          : (loanAmount *
              monthlyRate *
              Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);

      return {
        years,
        months,
        monthly,
        totalPaid: monthly * months,
        totalInterest:
          monthly * months - loanAmount,
      };
    });

    return {
      totalPrice: price,
      equity,
      loanAmount,
      capped: rawLoan > 6_000_000,
      monthlyPayments,
    };
  }, [property, customPrice, pagibigRate]);

  const formatPrice = useMemo(() => {
    if (!property) return "Price on request";

    const value = Number(property.price);

    if (Number.isNaN(value))
      return "Price on request";

    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(value);
  }, [property]);

  const copyMortgageComputation = async () => {
    if (!property || !financing || !tenantSettings) return;

    const text = buildMortgageComputation({
      property,
      tenantSettings,
      financing,
      pagibig,
      interestRate,
      pagibigRate,
    });

    await navigator.clipboard.writeText(text);

    alert("Mortgage computation copied.");
  };

  return {
    financing,
    pagibig,

    formatPrice,

    interestRate,
    setInterestRate,

    pagibigRate,
    setPagibigRate,

    financingMode,
    setFinancingMode,

    copyMortgageComputation,
  };
}