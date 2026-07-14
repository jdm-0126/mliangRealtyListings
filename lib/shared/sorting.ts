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

export const Sorters = {
  newest: (a: any,b:any) =>
    b.property_id - a.property_id,

  oldest: (a: any,b:any) =>
    a.property_id - b.property_id,

  price_high: (a: any,b:any) =>
    parsePrice(b.Listing_Price) -
    parsePrice(a.Listing_Price),

  price_low: (a: any,b:any) =>
    parsePrice(a.Listing_Price) -
    parsePrice(b.Listing_Price),

  title_asc: (a: any,b:any) =>
    cleanString(a.Title)
      .localeCompare(cleanString(b.Title)),

  title_desc: (a: any,b:any) =>
    cleanString(b.Title)
      .localeCompare(cleanString(a.Title)),

  location_asc: (a: any,b:any) =>
    getLocationText(a)
      .localeCompare(getLocationText(b)),

  location_desc: (a: any,b:any) =>
    getLocationText(b)
      .localeCompare(getLocationText(a))
}

