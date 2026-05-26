import { v2 as cloudinary } from "cloudinary";
import { Logger } from "./logger";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from "../constants/e";

// Cloudinary is configured once here; user.controller imports helpers from this file.
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

/**
 * Attempts to delete a Cloudinary asset by its secure URL.
 * Logs the outcome but never throws — deletion failure should not block other work.
 */
export async function deleteCloudinaryAsset(imageUrl: string): Promise<void> {
  if (!imageUrl.includes("cloudinary.com")) {
    Logger.debug(`Skipping non-Cloudinary URL: ${imageUrl}`);
    return;
  }

  const urlMatch = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!urlMatch) {
    Logger.error(`Could not extract public_id from Cloudinary URL: ${imageUrl}`);
    return;
  }

  // Strip file extension to get the public_id
  const publicId = urlMatch[1].replace(/\.[^/.]+$/, "");

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      Logger.success(`Deleted Cloudinary asset: ${publicId}`);
    } else if (result.result === "not found") {
      Logger.warn(`Cloudinary asset not found (already deleted?): ${publicId}`);
    } else {
      Logger.warn(`Unexpected Cloudinary delete result "${result.result}" for: ${publicId}`);
    }
  } catch (error) {
    Logger.error(`Error deleting Cloudinary asset: ${publicId}`, error);
  }
}

/**
 * Uploads a local file to Cloudinary and returns the secure URL.
 * Throws on upload failure so the caller can respond with an appropriate error.
 */
export async function uploadToCloudinary(
  localFilePath: string,
  options: {
    folder: string;
    publicId?: string;
  }
): Promise<string> {
  const result = await cloudinary.uploader.upload(localFilePath, {
    folder: options.folder,
    public_id: options.publicId,
    overwrite: true,
    resource_type: "image",
  });
  return result.secure_url;
}
