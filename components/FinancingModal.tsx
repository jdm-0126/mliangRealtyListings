"use client";

import React from "react";
import { FinancingResult } from "@/lib/shared/types/public";

interface FinancingModalProps {
  open: boolean;
  onClose: () => void;

  financing: FinancingResult;
  pagibig: FinancingResult;
  rawMortgage: number;
  interestRate: number;
  setInterestRate: React.Dispatch<React.SetStateAction<number>>;

  pagibigRate: number;
  setPagibigRate: React.Dispatch<React.SetStateAction<number>>;

  financingMode: "bank" | "pagibig";
  setFinancingMode: React.Dispatch<
    React.SetStateAction<"bank" | "pagibig">
  >;
}

export function FinancingModal({
  open,
  onClose,
  financing,
  rawMortgage,
  pagibig,
  interestRate,
  setInterestRate,
  pagibigRate,
  setPagibigRate,
  financingMode,
  setFinancingMode,
}: FinancingModalProps) {
  if (!open || !financing) return null;

  const data =
    financingMode === "bank"
      ? financing
      : pagibig;

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6">

        <h2 className="mb-6 text-2xl font-bold">
          Financing Calculator
        </h2>

        {/* Financing Type */}
        {financing &&
        <div className="mb-4 flex gap-2">
          <button
            className={`rounded px-4 py-2 ${
              financingMode === "bank"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setFinancingMode("bank")}
          >
            Bank
          </button>
         
        {pagibig &&
          <button
            className={`rounded px-4 py-2 ${
              financingMode === "pagibig"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setFinancingMode("pagibig")}
          >
            Pag-IBIG
          </button>
}
        </div>
}
        {/* Interest Rate */}
        <div className="mb-6">
          <label className="mb-2 block font-medium">
            Interest Rate (%)
          </label>

          <input
            type="number"
            step="0.1"
            className="w-32 rounded border p-2"
            value={
              financingMode === "bank"
                ? interestRate
                : pagibigRate
            }
            onChange={(e) =>
              financingMode === "bank"
                ? setInterestRate(Number(e.target.value))
                : setPagibigRate(Number(e.target.value))
            }
          />
        </div>

        <div className="space-y-2">
          <p>
            <strong>Total Price:</strong>{" "}
            {data.totalPrice.toLocaleString()}
          </p>

          <p>
            <strong>Equity:</strong>{" "}
            {data.equity.toLocaleString()}
          </p>

          <p>
            <strong>Loan Amount:</strong>{" "}
            {data.loanAmount.toLocaleString()}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {data.monthlyPayments.map((payment) => (
            <div
              key={payment.years}
              className="rounded border p-4"
            >
              <h3 className="font-semibold">
                {payment.years} Years
              </h3>

              <p>
                Monthly Payment:{" "}
                {payment.monthly.toLocaleString()}
              </p>

              <p>
                Total Interest:{" "}
                {payment.totalInterest.toLocaleString()}
              </p>

              <p>
                Total Paid:{" "}
                {payment.totalPaid.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}