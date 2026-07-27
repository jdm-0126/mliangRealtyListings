"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BuyingProcessModalProps {
  open: boolean;
  onClose: () => void;
}

export function BuyingProcessModal({
  open,
  onClose,
}: BuyingProcessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Property Buying Process in the Philippines
            </CardTitle>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-sm">
          <p className="font-medium text-gray-900">
            In the Philippines, buying a titled house and lot requires due
            diligence, contract execution, tax payments, a notarized Deed of
            Absolute Sale, and title transfer at the Registry of Deeds.
          </p>

          <div className="space-y-4">

            {/* 1 */}
            <section>
              <h3 className="mb-2 font-bold">
                1️⃣ Due Diligence (Before Paying in Full)
              </h3>

              <div className="ml-4 space-y-3">

                <div>
                  <h4 className="font-semibold">
                    A. Verify the Title
                  </h4>

                  <p>
                    Request a Certified True Copy from the Registry of Deeds.
                  </p>

                  <ul className="ml-6 list-disc">
                    <li>Title matches seller's copy</li>
                    <li>Owner matches valid ID</li>
                    <li>No liens or encumbrances</li>
                    <li>No adverse claims</li>
                    <li>If mortgaged, obtain Release of Mortgage</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">
                    B. Verify Real Property Tax
                  </h4>

                  <ul className="ml-6 list-disc">
                    <li>Latest Tax Declaration</li>
                    <li>Tax Clearance</li>
                    <li>No unpaid real property tax</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">
                    C. Inspect the Property
                  </h4>

                  <ul className="ml-6 list-disc">
                    <li>Verify boundaries</li>
                    <li>Check for occupants</li>
                    <li>Confirm road access</li>
                  </ul>
                </div>

              </div>
            </section>

            {/* 2 */}
            <section>
              <h3 className="mb-2 font-bold">
                2️⃣ Contract to Sell
              </h3>

              <ul className="ml-6 list-disc">
                <li>Used for installment purchases</li>
                <li>Contains payment schedule</li>
                <li>Contains penalties and turnover terms</li>
              </ul>

              <p className="mt-2">
                Cash purchases usually proceed directly to the Deed of Absolute
                Sale.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h3 className="mb-2 font-bold">
                3️⃣ Deed of Absolute Sale
              </h3>

              <ul className="ml-6 list-disc">
                <li>Prepare the DOAS</li>
                <li>Government IDs</li>
                <li>TIN numbers</li>
                <li>Marriage certificate (if applicable)</li>
              </ul>

              <p className="mt-2 font-semibold text-red-700">
                The document must be notarized.
              </p>
            </section>

            {/* 4 */}
            <section>
              <h3 className="mb-2 font-bold">
                4️⃣ Pay Taxes
              </h3>

              <div className="rounded bg-gray-50 p-3">
                <div className="flex justify-between">
                  <span>Capital Gains Tax</span>
                  <span>6% (Seller)</span>
                </div>

                <div className="flex justify-between">
                  <span>Documentary Stamp Tax</span>
                  <span>1.5% (Buyer)</span>
                </div>
              </div>

              <p className="mt-2 font-semibold text-red-700">
                The BIR Certificate Authorizing Registration (CAR) is required
                before title transfer.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h3 className="mb-2 font-bold">
                5️⃣ Transfer the Title
              </h3>

              <ul className="ml-6 list-disc">
                <li>Original title</li>
                <li>DOAS</li>
                <li>CAR</li>
                <li>Tax Clearance</li>
                <li>Transfer Tax Receipt</li>
              </ul>

              <p className="mt-2 text-green-700 font-semibold">
                Processing usually takes 2–4 weeks.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h3 className="mb-2 font-bold">
                6️⃣ Transfer Tax Declaration
              </h3>

              <ul className="ml-6 list-disc">
                <li>New Title</li>
                <li>DOAS</li>
                <li>CAR</li>
              </ul>
            </section>

            <div className="rounded bg-blue-50 p-4">
              <h3 className="mb-2 font-bold">
                Typical Transaction Costs
              </h3>

              <ul className="space-y-1">
                <li>CGT – 6%</li>
                <li>DST – 1.5%</li>
                <li>Transfer Tax – 0.5%–0.75%</li>
                <li>Registration Fee</li>
                <li>Notarial Fee</li>
              </ul>
            </div>

            <div className="rounded bg-red-50 p-4">
              <h3 className="mb-2 font-bold text-red-700">
                Important Reminders
              </h3>

              <ul className="ml-6 list-disc text-red-700">
                <li>Verify the title before paying.</li>
                <li>Avoid "Rights Only" properties.</li>
                <li>Married sellers require spouse consent.</li>
                <li>Inherited property must have settled estate taxes.</li>
              </ul>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BuyingProcessModal;