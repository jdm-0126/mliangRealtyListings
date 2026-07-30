import { TenantSettings } from "@/lib/shared/types/public";
import { HASHTAGS } from "@/lib/shared/constants"
import { BuildFacebookPostOptions } from "@/lib/shared/types/public";

export function buildFacebookPost({
  property,
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

  const price = property.listingPrice
    ? new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
      }).format(property.listingPrice)
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
    "",
    (HASHTAGS ??
      "#realestate #houseforsale #dreamhome") + mediaInfo,
  ].join("\n");
}