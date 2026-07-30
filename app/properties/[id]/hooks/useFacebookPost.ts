import { useMemo } from "react";
import { buildFacebookPost } from "@/lib/shared/facebook/buildFacebookPosts";
import { Property } from "@/lib/shared/types/public"
// import { UseFacebookPostProps } from "@/lib/shared/types/public"

interface UseFacebookPostProps {
  property: Property | null;
  hasPhotos?: boolean;
  hasVideo?: boolean;
}

export function useFacebookPost({
  property ,
  hasPhotos = false,
  hasVideo = false,
}: UseFacebookPostProps) {
  const fbPostPreview = useMemo(() => {
  if (!property) return "";

  return buildFacebookPost({
    property,
    hasPhotos,
    hasVideo
  });
}, [property, hasPhotos, hasVideo]);

  const copyToClipboard = async () => {
  if (!property) return;

  await navigator.clipboard.writeText(fbPostPreview);
  alert("Facebook post copied!");
};

  return {
    fbPostPreview,
    copyToClipboard,
  };
}