export function normalizePayload(payload: any) {
  return {
    property_id:
      payload.property_id === ""
        ? undefined
        : Number(payload.property_id),

    title: payload.Title,

    location: payload.Location,

    village: payload.Village,

    listing_price:
      payload.Listing_Price === ""
        ? null
        : Number(
            String(payload.Listing_Price).replace(/[₱,\s]/g, "")
          ),

    lot_area_sqm:
      payload.Lot_Area_sqm === ""
        ? null
        : Number(payload.Lot_Area_sqm),

    floor_area_sqm:
      payload.Floor_Area_sqm === ""
        ? null
        : Number(payload.Floor_Area_sqm),

    bedroom:
      payload.Bedroom === ""
        ? null
        : Number(payload.Bedroom),

    bathroom:
      payload.Bathroom === ""
        ? null
        : Number(payload.Bathroom),

    garage:
      payload.Garage === ""
        ? null
        : Number(payload.Garage),

    preview_photo: payload.Preview_Photo,

    photos: payload.Photos,

    fb_link: payload.FB_Link,

    video_url: payload.Video_URL,

    facebook_video_url: payload.Facebook_Video_URL,

    tiktok_video_url: payload.Tiktok_Video_URL,

    listing_mode: payload.Listing_Mode,

    financing_options: payload.Financing_options,

    notes: payload.Notes,

    type: payload.Type,

    status: payload.Status,

    negotiable: payload.Negotiable,

    cgt: payload.CGT,

    transfer_title: payload.Transfer_Title,

    listing_agent: payload.Listing_Agent,
  }
}