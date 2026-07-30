"use client";

import { Property } from "@/lib/shared/types/public";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PropertyInfoProps {
  property: Property;
}

export function PropertyInfo({ property }: PropertyInfoProps) {
  const isLotOnly = property.type?.toLowerCase() === "lot";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {property.notes && (
          <div>
            <h3 className="font-semibold">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {property.notes}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {property.type && (
            <InfoItem
              label="Property Type"
              value={property.type}
            />
          )}

          {property.status && (
            <InfoItem
              label="Status"
              value={property.status}
            />
          )}

          {property.listingMode && (
            <InfoItem
              label="Listing Mode"
              value={property.listingMode}
            />
          )}

          {property.lotArea && (
            <InfoItem
              label="Lot Area"
              value={`${property.lotArea} sqm`}
            />
          )}

          {!isLotOnly && property.floorArea && (
            <InfoItem
              label="Floor Area"
              value={`${property.floorArea} sqm`}
            />
          )}

          {!isLotOnly && property.bedrooms && (
            <InfoItem
              label="Bedrooms"
              value={property.bedrooms}
            />
          )}

          {!isLotOnly && property.bathrooms && (
            <InfoItem
              label="Bathrooms"
              value={property.bathrooms}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
}

function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}