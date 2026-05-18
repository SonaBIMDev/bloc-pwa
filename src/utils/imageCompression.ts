export interface CompressImageOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp";
}

export async function compressImage(
  file: File,
  options: CompressImageOptions
): Promise<File> {
  const {
    maxWidth,
    maxHeight,
    quality = 0.8,
    mimeType = "image/jpeg"
  } = options;

  const imageBitmap = await createImageBitmap(file);

  let { width, height } = imageBitmap;

  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  const targetWidth = Math.round(width * ratio);
  const targetHeight = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossible de créer le contexte canvas.");
  }

  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });

  if (!blob) {
    throw new Error("Impossible de compresser l'image.");
  }

  const extension = mimeType === "image/webp" ? "webp" : "jpg";
  const compressedFileName = file.name.replace(/\.[^.]+$/, "") + `.${extension}`;

  return new File([blob], compressedFileName, {
    type: mimeType,
    lastModified: Date.now()
  });
}