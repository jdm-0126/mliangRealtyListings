import { parsePrice, cleanString, getLocationText } from '../propertyFilters'


export type SortKey =
  | "newest"
  | "oldest"
  | "title_asc"
  | "title_desc"
  | "description_asc"
  | "description_desc";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title_asc", label: "Project A–Z" },
  { value: "title_desc", label: "Project Z–A" },
  { value: "description_asc", label: "Location A–Z" },
  { value: "description_desc", label: "Location Z–A" },
];

export const Sorters: Record<string, (a: any, b: any) => number> = {
  newest: (a, b) => Number(b.property_id) - Number(a.property_id),

  oldest: (a, b) => Number(a.property_id) - Number(b.property_id),

  location_asc: (a, b) =>
    `${a.Village ?? ""}, ${a.Location ?? ""}`.localeCompare(
      `${b.Village ?? ""}, ${b.Location ?? ""}`
    ),

  location_desc: (a, b) =>
    `${b.Village ?? ""}, ${b.Location ?? ""}`.localeCompare(
      `${a.Village ?? ""}, ${a.Location ?? ""}`
    ),

  "price-high": (a, b) =>
    parsePrice(b.Listing_Price) - parsePrice(a.Listing_Price),

  "price-low": (a, b) =>
    parsePrice(a.Listing_Price) - parsePrice(b.Listing_Price),


  // title_asc: (a: any,b:any) =>
  //   cleanString(a.Title)
  //     .localeCompare(cleanString(b.Title)),

  // title_desc: (a: any,b:any) =>
  //   cleanString(b.Title)
  //     .localeCompare(cleanString(a.Title)),

  // location_asc: (a: any,b:any) =>
  //   getLocationText(a)
  //     .localeCompare(getLocationText(b)),

  // location_desc: (a: any,b:any) =>
  //   getLocationText(b)
  //     .localeCompare(getLocationText(a))
}

