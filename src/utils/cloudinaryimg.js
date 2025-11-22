import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryimg = async (localpath) => {
  try {
    if (!localpath) return null;

    const ext = localpath.split(".").pop().toLowerCase();
    let resource_type = "image"; // PDF aur images ke liye same

    const response = await cloudinary.uploader.upload(localpath, {
      resource_type: resource_type,
      format: ext === "pdf" ? "pdf" : undefined,
      pages: ext === "pdf" ? true : undefined,
    });

    return response.secure_url;
  } catch (error) {
    if (fs.existsSync(localpath)) fs.unlinkSync(localpath);
    throw error;
  }
};

export { cloudinaryimg };
