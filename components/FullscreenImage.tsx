import { X } from "lucide-react";
import Image from "next/image";

interface FullscreenImageProps {
    open: boolean;
    imageUrl?: string;
    images?: string[];
    alt: string;
    onClose: () => void;
}

export function FullscreenImage({
  open,
  imageUrl,
  images = [],
  alt,
  onClose,
}: FullscreenImageProps) {
  if (!open || !imageUrl) return null;

  return (
    <div
        className="relative h-[90vh] w-[90vw]"
        onClick={(e) => e.stopPropagation()}
        >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 text-white hover:text-gray-300"
        aria-label="Close image"
      >
        <X className="h-8 w-8" />
      </button>

       <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-contain"
        />
</div>
  );
}