// app/(public)/listings/[id]/page.tsx — Estatein dark theme
import type { ElementType } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getPropertyGallery } from "@/lib/shared/gallery/getPropertyGallery";
import type { PublicListing } from "@/lib/shared/types/public";
import {
  buildRealEstateListingJsonLd,
  generateDetailTitle,
  buildCanonicalUrl,
} from "@/lib/seo/jsonld";
import ImageGallery from "@/components/ImageGallery";
import JsonLd from "@/app/(public)/components/JsonLd";
import {
  MapPin,
  Maximize2,
  Home,
  BedDouble,
  Bath,
  Mail,
  ArrowLeft,
  Map,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseNum(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n =
    typeof raw === "number"
      ? raw
      : Number(String(raw).replace(/[^\d.]/g, ""));
  return isNaN(n) || n <= 0 ? null : n;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatListingType(type?: string | null): string {
  const value = (type ?? "").trim().toLowerCase();
  if (!value) return "";
  if (value.includes("commercial")) return "Commercial";
  if (value.includes("house") || value.includes("residential"))
    return "House and Lot";
  if (value.includes("lot only") || value === "lot") return "Lot only";
  if (value.includes("lot")) return "Lot only";
  return type?.trim() || "";
}

async function fetchListing(displayId: number): Promise<PublicListing | null> {
  const internalId = displayId >= 2 ? displayId + 1 : displayId;
  console.log("Looking for property", internalId);

  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("property_id", internalId)
      .single();

    if (error || !data) return null;

    const row = data;
    const statusRaw = String(row.status ?? "").toLowerCase();
    if (statusRaw !== "active") return null;

    const id = Number(row.property_id);
    const gallery = await getPropertyGallery(id);
    const photos = gallery.map((image) => image.url);

    const previewRaw = row.preview_photo;
    if (
      typeof previewRaw === "string" &&
      previewRaw.trim() &&
      !photos.includes(previewRaw.trim())
    ) {
      photos.unshift(previewRaw.trim());
    }

    const extraPhotos = Array.isArray(row.photos) ? (row.photos as string[]) : [];
    for (const p of extraPhotos) {
      if (p && !photos.includes(p)) photos.push(p);
    }

    return {
      property_id: id,
      title: String(row.title ?? `Property ${displayId}`),
      displayId,
      type: String(row.type ?? ""),
      location: String(row.location ?? ""),
      village:
        typeof row.village === "string" && row.village.trim()
          ? row.village.trim()
          : undefined,
      price: parseNum(row.listing_price),
      lotArea: parseNum(row.lot_area_sqm),
      floorArea: parseNum(row.floor_area_sqm),
      notes: String(row.notes ?? ""),
      bedrooms: parseNum(row.bedroom),
      bathrooms: parseNum(row.bathroom),
      previewPhoto: photos[0] ?? null,
      photos,
      status: String(row.status ?? ""),
      mapUrl:
        typeof row.map_url === "string" && row.map_url.trim()
          ? row.map_url.trim()
          : null,
      videoUrl:
        typeof row.video_url === "string" && row.video_url.trim()
          ? row.video_url.trim()
          : null,
      facebookVideoUrl:
        typeof row.facebook_video_url === "string" &&
        row.facebook_video_url.trim()
          ? row.facebook_video_url.trim()
          : null,
      tiktokVideoUrl:
        typeof row.tiktok_video_url === "string" &&
        row.tiktok_video_url.trim()
          ? row.tiktok_video_url.trim()
          : null,
      updatedAt:
        typeof row.updated_at === "string" ? row.updated_at : undefined,
    };
  } catch {
    return null;
  }
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const displayId = Number(id);
  if (isNaN(displayId)) return { title: "Property Not Found – M. Liang Realty" };

  const listing = await fetchListing(displayId);
  if (!listing) return { title: "Property Not Found – M. Liang Realty" };

  const title = generateDetailTitle(listing.type, listing.location);
  const rawNotes = listing.notes ?? "";
  const description =
    rawNotes.length > 157 ? rawNotes.slice(0, 157) + "..." : rawNotes || title;
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://realtyprov1-jdm0126s-projects.vercel.app";

  const canonicalUrl = buildCanonicalUrl(
    SITE_URL,
    `/listings/${listing.displayId}`
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: listing.previewPhoto ? [{ url: listing.previewPhoto }] : [],
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: listing.previewPhoto ? [listing.previewPhoto] : [],
    },
    alternates: { canonical: canonicalUrl },
  };
}

function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-28 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{
          background: "var(--est-elevated)",
          border: "1px solid var(--est-border)",
        }}
      >
        <svg
          className="w-10 h-10"
          style={{ color: "var(--est-muted)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
        </svg>
      </div>
      <h1
        className="text-2xl font-bold mb-3"
        style={{ color: "var(--est-text)" }}
      >
        Property not found
      </h1>
      <p className="mb-8 text-sm" style={{ color: "var(--est-muted)" }}>
        This listing may have been removed or is no longer available.
      </p>
      <Link
        href="/listings"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: "var(--est-purple)", color: "#fff" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </Link>
    </main>
  );
}

function StatPill({
  icon: Icon,
  label,
}: {
  icon: ElementType;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
      style={{
        background: "var(--est-elevated)",
        border: "1px solid var(--est-border)",
        color: "var(--est-subtle)",
      }}
    >
      <Icon
        className="w-4 h-4 flex-shrink-0"
        style={{ color: "var(--est-purple)" }}
      />
      <span>{label}</span>
    </div>
  );
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const displayId = Number(id);
  if (isNaN(displayId)) return <NotFound />;

  const listing = await fetchListing(displayId);
  if (!listing) return <NotFound />;

  const addressParts = [listing.village, listing.location].filter(Boolean);
  const address = addressParts.join(", ") || listing.location;
  const contactHref = `/contact?property=${encodeURIComponent(address)}`;
  const displayType = formatListingType(listing.type);

  return (
    <>
      <JsonLd data={buildRealEstateListingJsonLd(listing)} />

      <main className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:opacity-70"
          style={{ color: "var(--est-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Details */}
          <div className="flex flex-col gap-5">
            {/* Type badge + id */}
            <div className="flex items-center gap-3 flex-wrap">
              {displayType && (
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: "var(--est-purple)", color: "#fff" }}
                >
                  {displayType}
                </span>
              )}
              <span className="text-xs" style={{ color: "var(--est-muted)" }}>
                Property #{listing.displayId}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-start gap-2">
              <MapPin
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: "var(--est-purple)" }}
              />
              <span className="text-sm" style={{ color: "var(--est-muted)" }}>
                {address}
              </span>
            </div>

            {/* Price */}
            {listing.price !== null ? (
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--est-text)" }}
              >
                {formatPrice(listing.price)}
              </p>
            ) : (
              <p
                className="text-xl font-semibold italic"
                style={{ color: "var(--est-muted)" }}
              >
                Price on request
              </p>
            )}

            {/* Stats */}
            {(listing.lotArea !== null ||
              listing.floorArea !== null ||
              listing.bedrooms !== null ||
              listing.bathrooms !== null) && (
              <div className="grid grid-cols-2 gap-3">
                {listing.lotArea !== null && (
                  <StatPill
                    icon={Maximize2}
                    label={`${listing.lotArea.toLocaleString()} sqm lot`}
                  />
                )}
                {listing.floorArea !== null && (
                  <StatPill
                    icon={Home}
                    label={`${listing.floorArea.toLocaleString()} sqm floor`}
                  />
                )}
                {listing.bedrooms !== null && (
                  <StatPill
                    icon={BedDouble}
                    label={`${listing.bedrooms} bedroom${
                      listing.bedrooms !== 1 ? "s" : ""
                    }`}
                  />
                )}
                {listing.bathrooms !== null && (
                  <StatPill
                    icon={Bath}
                    label={`${listing.bathrooms} bathroom${
                      listing.bathrooms !== 1 ? "s" : ""
                    }`}
                  />
                )}
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: "1px solid var(--est-border)" }} />

            {/* Notes */}
            {listing.notes && (
              <div>
                <h2
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "var(--est-muted)" }}
                >
                  Description
                </h2>
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: "var(--est-subtle)" }}
                >
                  {listing.notes}
                </p>
              </div>
            )}

            {/* Map link */}
            {listing.mapUrl && (
              <a
                href={listing.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{
                  background: "var(--est-elevated)",
                  border: "1px solid var(--est-border)",
                  color: "var(--est-subtle)",
                }}
              >
                <Map
                  className="w-4 h-4"
                  style={{ color: "var(--est-purple)" }}
                />
                View on Map
              </a>
            )}

            {/* CTA */}
            <div className="mt-auto pt-2">
              <Link
                href={contactHref}
                className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: "var(--est-purple)", color: "#fff" }}
                data-testid="contact-cta"
              >
                <Mail className="w-4 h-4" />
                Contact About This Property
              </Link>
            </div>
          </div>

          {/* Gallery */}
          <div>
            <ImageGallery
              photos={listing.photos}
              alt={`${listing.type} in ${listing.location}`}
            />

            {/* Video */}
            {(listing.videoUrl ||
              listing.facebookVideoUrl ||
              listing.tiktokVideoUrl) && (
              <div className="mt-4">
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "var(--est-muted)" }}
                >
                  Property Video
                </h2>
                {listing.videoUrl ? (
                  <video
                    controls
                    className="w-full rounded-xl"
                    style={{ border: "1px solid var(--est-border)" }}
                  >
                    <source src={listing.videoUrl} type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                ) : listing.tiktokVideoUrl ? (
                  <div className="flex justify-center flex-col items-center">
                    <blockquote
                      className="tiktok-embed"
                      cite={listing.tiktokVideoUrl}
                      data-video-id={
                        listing.tiktokVideoUrl.match(/video\/(\d+)/)?.[1] ?? ""
                      }
                      style={{ maxWidth: 605, minWidth: 325 }}
                    >
                      <section />
                    </blockquote>
                    <Script
                      src="https://www.tiktok.com/embed.js"
                      strategy="lazyOnload"
                    />
                  </div>
                ) : listing.facebookVideoUrl ? (
                  <div
                    className="relative w-full overflow-hidden rounded-xl"
                    style={{
                      paddingBottom: "56.25%",
                      border: "1px solid var(--est-border)",
                    }}
                  >
                    <iframe
                      src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
                        listing.facebookVideoUrl
                      )}&show_text=false&autoplay=false`}
                      className="absolute inset-0 w-full h-full"
                      style={{ border: "none" }}
                      allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}