import { TenantSettings, PublicListing } from "@/lib/shared/types/public";
import { HASHTAGS } from "@/lib/constants"
import { BuildFacebookPostOptions } from "@/lib/shared/types/public";

function formatTenantFooter(tenantSettings: TenantSettings) {
  return `${tenantSettings.brokerName}
${tenantSettings.brokerTitle}
PRC No. ${tenantSettings.prcNumber}
${tenantSettings.officeAddress}`;
}

export function buildFacebookPost({
  property,
  tenantSettings,
  hasPhotos = false,
  hasVideo = false,
}: BuildFacebookPostOptions): string {
  if (!property) return "";

  let mediaInfo = "";

  if (hasPhotos && hasVideo) mediaInfo = "\n\nPM for Photos and Video";
  else if (hasPhotos) mediaInfo = "\n\nPM for Photos";
  else if (hasVideo) mediaInfo = "\n\nPM for Video";

  const isLotOnly = property.type?.toLowerCase() === "lot";

  const heading = isLotOnly
    ? "LOT FOR SALE"
    : "HOUSE AND LOT FOR SALE";

  const readyText = isLotOnly ? "" : "\n(Ready for Occupancy)";

  const propertyDetails: string[] = [];

  if (property.lotArea) {
    propertyDetails.push(`Lot Area: ${property.lotArea} sqm`);
  }

  if (!isLotOnly && property.floorArea) {
    propertyDetails.push(`Floor Area: ${property.floorArea} sqm`);
  }

  if (!isLotOnly) {
    if (property.bedrooms) {
      propertyDetails.push(`${property.bedrooms} Bedroom(s)`);
    }

    if (property.bathrooms) {
      propertyDetails.push(`${property.bathrooms} Bathroom(s)`);
    }
  }

  const price = property.price
    ? new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
      }).format(property.price)
    : "On request";

  return [
    heading + readyText,
    `${property.village ?? ""} ${property.location ?? ""}`,
    "",
    "Property Highlights:",
    ...propertyDetails,
    "",
    property.notes ?? "",
    "",
    `Price ${price}`,
    "MOP: Cash or Bank Financing",
    "",
    tenantSettings.businessName,
    formatTenantFooter(tenantSettings),
    "",
    (HASHTAGS ??
      "#realestate #houseforsale #dreamhome") + mediaInfo,
  ].join("\n");
}