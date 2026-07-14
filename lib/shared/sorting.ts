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