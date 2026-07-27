export function getEmbeddableUrl(url: string): string {
  if (!url) return "";

  try {
    // Standardize URL parsing if valid
    const parsedUrl = new URL(url);

    // YouTube Shorts: youtube.com/shorts/ID
    const ytShorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (ytShorts) {
      return `https://www.youtube.com/embed/${ytShorts[1]}`;
    }

    // Standard YouTube: youtube.com/watch?v=ID or youtube.com/live/ID
    const ytStandard = url.match(/(?:youtube\.com\/(?:watch\?.*v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytStandard) {
      return `https://www.youtube.com/embed/${ytStandard[1]}`;
    }

    // Google Drive File (file/d/ID or open?id=ID)
    const driveFile = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
    if (driveFile) {
      return `https://drive.google.com/file/d/${driveFile[1]}/preview`;
    }

    // Google Drive Folder
    const driveFolder = url.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
    if (driveFolder) {
      return `https://drive.google.com/embeddedfolderview?id=${driveFolder[1]}#grid`;
    }

    // Dropbox
    if (parsedUrl.hostname.endsWith("dropbox.com")) {
      parsedUrl.hostname = "dl.dropboxusercontent.com";
      parsedUrl.searchParams.set("raw", "1");
      parsedUrl.searchParams.delete("dl");
      return parsedUrl.toString();
    }

    // Vimeo
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) {
      return `https://player.vimeo.com/video/${vimeo[1]}`;
    }
  } catch {
    // If URL parsing fails (malformed URL), fallback to raw url
    return url;
  }

  return url;
}

export function canEmbed(url: string): boolean {
  if (!url) return false;
  return !isGooglePhotos(url);
}

export function isGooglePhotos(url: string): boolean {
  return (
    url.includes("photos.google.com") ||
    url.includes("photos.app.goo.gl")
  );
}

export function isVideo(url: string): boolean {
  if (!url) return false;
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com") ||
    /\.(mp4|webm|ogg|mov|mkv)$/i.test(url)
  );
}

export function isPdf(url: string): boolean {
  if (!url) return false;
  // Handle URLs with query strings attached to .pdf (e.g. file.pdf?v=123)
  try {
    const pathname = new URL(url).pathname;
    return pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().includes(".pdf");
  }
}

export function isImage(url: string): boolean {
  if (!url) return false;
  try {
    const pathname = new URL(url).pathname;
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(pathname);
  } catch {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
  }
}