import { useMemo } from "react";
import { buildFacebookPost } from "@/lib/shared/facebook/buildFacebookPost";
import { PublicListing, TenantSettings } from "@/lib/shared/types/public"
// import { UseFacebookPostProps } from "@/lib/shared/types/public"

interface UseFacebookPostProps {
  property: PublicListing | null;
  tenantSettings: TenantSettings | null;
  hasPhotos?: boolean;
  hasVideo?: boolean;
}

export function useFacebookPost({
  property ,
  tenantSettings,
  hasPhotos = false,
  hasVideo = false,
}: UseFacebookPostProps) {
  const fbPostPreview = useMemo(() => {
  if (!property || !tenantSettings) return "";

  return buildFacebookPost({
    property,
    tenantSettings,
    hasPhotos,
    hasVideo,
  });
}, [property, tenantSettings, hasPhotos, hasVideo]);

  const copyToClipboard = async () => {
  if (!property || !tenantSettings) return;

  await navigator.clipboard.writeText(fbPostPreview);
  alert("Facebook post copied!");
};

  return {
    fbPostPreview,
    copyToClipboard,
  };
}