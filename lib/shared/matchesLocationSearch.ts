export const matchesLocationSearch = (
  row: Record<string, any>,
  search: string
) => {
  if (!search.trim()) return true;

  const q = search.toLowerCase();

  return [
    row.location,
    row.title,
    row.city,
    row.province,
    row.subdivision,
    row.barangay,
  ]
    .filter(Boolean)
    .some((value) =>
      String(value).toLowerCase().includes(q)
    );
};