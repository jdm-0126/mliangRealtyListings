"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicListing } from "@/lib/shared/types/public";

interface UploadPhotoModalProps {
  open: boolean;
  onClose: () => void;
  property: PublicListing | null;
  onUpload?: (file: File) => Promise<void>;
}

export default function UploadPhotoModal({
  open,
  onClose,
  property,
  onUpload,
}: UploadPhotoModalProps) {
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    try {
      setUploading(true);
      await onUpload(file);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <ImagePlus className="mx-auto mb-3 h-10 w-10 text-blue-600" />

          <h2 className="text-xl font-semibold">
            Upload Property Photo
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {property?.title ?? "Select a property"}
          </p>
        </div>

        <label className="block">
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            asChild
            className="w-full cursor-pointer"
            disabled={uploading}
          >
            <span>
              {uploading
                ? "Uploading..."
                : "Choose Image"}
            </span>
          </Button>
        </label>

        <Button
          variant="outline"
          className="mt-3 w-full"
          onClick={onClose}
          disabled={uploading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}