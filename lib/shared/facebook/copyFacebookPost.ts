import { TenantSettings } from "@/lib/shared/types/public"

export interface BuildFacebookPostOptions {
  property: any
  tenantSettings: TenantSettings
  hasPhotos?: boolean
  hasVideo?: boolean
}

function formatTenantFooter(tenantSettings: TenantSettings) {
  return `${tenantSettings.brokerName}
${tenantSettings.brokerTitle}
PRC No. ${tenantSettings.prcNumber}
${tenantSettings.officeAddress}`
}

export function copyFacebookPost({
  property,
  tenantSettings,
  hasPhotos = false,
  hasVideo = false,
}: BuildFacebookPostOptions): string {
  if (!property) return ""

  let mediaInfo = ""

  if (hasPhotos && hasVideo) mediaInfo = "\n\nPM for Photos and Video"
  else if (hasPhotos) mediaInfo = "\n\nPM for Photos"
  else if (hasVideo) mediaInfo = "\n\nPM for Video"

  const isLotOnly = property.Type?.toLowerCase() === "lot"

  const heading = isLotOnly
    ? "LOT FOR SALE"
    : "HOUSE AND LOT FOR SALE"

  const readyText = isLotOnly
    ? ""
    : "\n(ready for occupancy)"

  let propertyDetails = ""

  if (property.Lot_Area_sqm)
    propertyDetails += `\nLot Area: ${property.Lot_Area_sqm} sqm`

  if (!isLotOnly && property.Floor_Area_sqm)
    propertyDetails += `\nFloor Area: ${property.Floor_Area_sqm} sqm`

  if (!isLotOnly) {
    if (property.Bedroom)
      propertyDetails += `\n${property.Bedroom} Bedroom(s)`

    if (property.Bathroom)
      propertyDetails += `\n${property.Bathroom} Bathroom(s)`
  }

  return [
    heading + readyText,
    `${property.Village || ""} ${property.Location || ""}`,
    "",
    "Property Highlights:",
    propertyDetails,
    "",
    property.Notes || "",
    "",
    `Price ${
      property.Listing_Price
        ? new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 0,
          }).format(property.Listing_Price)
        : "On request"
    }`,
    "MOP: Cash or Bank Financing",
    "",
    tenantSettings.businessName,
    formatTenantFooter(tenantSettings),
    "",
    (property.Hashtags ||
      "#realestate #realtor #property #home #houseforsale #homeforsale #dreamhome #newhome #homebuyers #househunting #investmentproperty #luxuryhomes #modernhomes #familyhome #readytomovein #Pampanga #Philippines") +
      mediaInfo,
  ].join("\n")
}