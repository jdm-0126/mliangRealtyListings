"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicListing } from "@/lib/shared/types/public";

interface PropertyHeaderProps {
  property: PublicListing | null;
  tenantSettings: any;
}

export function PropertyHeader({
  property,
  tenantSettings
}: PropertyHeaderProps) {
  const router = useRouter();

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">
            Property Not Found
          </h2>

          <Button
            onClick={() => router.push("/admin/properties")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">
          {property.title}
        </h1>

        <p className="text-muted-foreground">
          {property.village}, {property.location}
        </p>
      </div>

      <Button
        variant="outline"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
  );
}