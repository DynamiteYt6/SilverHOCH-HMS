import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
});

/**
 * Uploads a base64-encoded image string to Cloudinary.
 * Returns the permanent secure URL.
 */
export async function uploadToCloudinary(
  base64Data: string,
  folder = "silverhoch/inventory"
): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "auto" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  return result.secure_url;
}

/**
 * Deletes an image from Cloudinary by its public URL.
 * Safe to call — won't throw if the image doesn't exist.
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  try {
    const parts = imageUrl.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return;

    const afterUpload = parts.slice(uploadIndex + 2).join("/");
    const publicId = afterUpload.replace(/\.[^/.]+$/, "");

    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Non-fatal
  }
}