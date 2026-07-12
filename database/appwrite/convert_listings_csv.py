"""
convert_listings_csv.py
Converts Supabase mlianglistings CSV to Appwrite-compatible CSV.

Usage:
    python database/appwrite/convert_listings_csv.py mlianglistings_rows.csv listings_appwrite.csv
"""

import csv
import sys
import re

COLUMN_MAP = {
    "property_id":        "property_id",
    "Type":               "Type",
    "Location":           "Location",
    "Village":            "Village",
    "Listing Price":      "Listing_Price",
    "Lot Area sqm":       "Lot_Area_sqm",
    "Floor Area sqm":     "Floor_Area_sqm",
    "Bedroom":            "Bedroom",
    "T&B":                "Bathroom",
    "Preview Photo":      "Preview_Photo",
    "Photos":             "Photos",
    "Title":              "Title",
    "Financing options":  "Financing_options",
    "Financing_options":  "Financing_options",
    "CGT":                "CGT",
    "Transfer Title":     "Transfer_Title",
    "Transfer_Title":     "Transfer_Title",
    "FB_Link":            "FB_Link",
    "Facebook Link":      "FB_Link",
    "Facebook URL":       "FB_Link",
    "Notes":              "Notes",
    "Status":             "Status",
    "Map URL":            "Map_URL",
    "Video URL":          "Video_URL",
    "Facebook Video URL": "Facebook_Video_URL",
    "featured":           "featured",
    "Listing Mode":       "Listing_Mode",
    "listing_mode":       "Listing_Mode",
    "tenant_id":          "tenant_id",
}

INT_FIELDS   = {"property_id", "Bedroom", "Bathroom", "tenant_id"}
FLOAT_FIELDS = {"Listing_Price", "Lot_Area_sqm", "Floor_Area_sqm"}
BOOL_FIELDS  = {"featured"}
MODE_FIELD   = "Listing_Mode"

OUT_COLS = [
    "property_id", "Type", "Location", "Village",
    "Listing_Price", "Lot_Area_sqm", "Floor_Area_sqm",
    "Bedroom", "Bathroom", "Preview_Photo", "Photos", "Title",
    "Financing_options", "CGT", "Transfer_Title", "Description",
    "FB_Link", "Notes", "Status", "Map_URL", "Video_URL",
    "Facebook_Video_URL", "featured", "Listing_Mode", "tenant_id",
]


def clean(v):
    return v.strip().replace("\r", "").replace("\n", " ")


def to_bool(v):
    return "true" if v.strip().lower() in ("true", "1", "yes", "t") else "false"


def main(input_path, output_path):
    csv.field_size_limit(10_000_000)

    with open(input_path, newline="", encoding="utf-8-sig") as f_in, \
         open(output_path, "w", newline="", encoding="utf-8") as f_out:

        reader = csv.DictReader(f_in)
        writer = csv.DictWriter(f_out, fieldnames=OUT_COLS, extrasaction="ignore")
        writer.writeheader()

        written = skipped = 0
        auto_id = 10000  # start auto-generated IDs above your real data

        for row in reader:
            out = {}

            for src, dst in COLUMN_MAP.items():
                val = row.get(src, "")

                # Skip if already set (deduplicates listing_mode / Listing Mode)
                if dst in out and out[dst]:
                    continue

                if dst in BOOL_FIELDS:
                    out[dst] = to_bool(val)
                elif dst in INT_FIELDS:
                    s = clean(val)
                    out[dst] = s if s and re.match(r"^\d+$", s) else ""
                elif dst in FLOAT_FIELDS:
                    s = re.sub(r"[^\d.]", "", clean(val))
                    out[dst] = s if s else ""
                elif dst == MODE_FIELD:
                    v = clean(val)
                    out[dst] = v if v in ("For Sale", "For Rent") else "For Sale"
                elif dst == "Preview_Photo":
                    v = clean(val)
                    out[dst] = "" if v.startswith("data:") else v[:2000]
                elif dst == "Photos":
                    v = clean(val)
                    out[dst] = "" if v.startswith("data:") else v[:2000]
                elif dst in ("Notes", "Description"):
                    out[dst] = clean(val)[:5000]
                elif dst in ("Map_URL", "Video_URL", "Facebook_Video_URL", "FB_Link"):
                    out[dst] = clean(val)[:2000]
                else:
                    out[dst] = clean(val)

            if not out.get("property_id"):
                out["property_id"] = str(auto_id)
                auto_id += 1
                skipped += 1  # count as auto-assigned

            writer.writerow(out)
            written += 1

    print("Done. %d rows written -> %s" % (written, output_path))
    if skipped:
        print("Auto-assigned property_id to %d rows" % skipped)

    # Verify
    print("Verifying...")
    csv.field_size_limit(10_000_000)
    with open(output_path, newline="", encoding="utf-8") as f:
        r2 = csv.reader(f)
        headers = next(r2)
        expected = len(headers)
        print("Columns: %d -> %s" % (expected, headers))
        bad = 0
        for i, row in enumerate(r2, 2):
            if len(row) != expected:
                print("  BAD row %d: got %d cols" % (i, len(row)))
                bad += 1
        print("All rows OK" if bad == 0 else "%d bad rows found" % bad)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_listings_csv.py <input.csv> <output.csv>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
