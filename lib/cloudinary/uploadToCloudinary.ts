export async function uploadPropertyImage(
  file: File,
  propertyId: number | string
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary environment variables.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  // Folder can be dynamically passed if "Allow unsigned folder override" is enabled in preset
  formData.append("folder", `properties/${propertyId}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Cloudinary Error:", data);
    throw new Error(data.error?.message || "Failed to upload image.");
  }

  return data.secure_url as string;
}