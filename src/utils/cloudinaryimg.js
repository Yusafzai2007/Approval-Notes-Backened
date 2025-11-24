import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryimg = async (localpath, publicIdToReplace = null) => {
  try {
    if (!localpath) return null;

    const ext = localpath.split(".").pop().toLowerCase();
    let resource_type = "raw"; // PDF aur images ke liye same

    // Agar existing publicId hai, delete karo pehle
    if (publicIdToReplace) {
      await cloudinary.uploader.destroy(publicIdToReplace, { resource_type });
    }

    const response = await cloudinary.uploader.upload(localpath, {
      resource_type: resource_type,
      format: ext === "pdf" ? "pdf" : undefined,
      pages: ext === "pdf" ? true : undefined,
      access_mode: "public", // ✅ Public access enable
    });

    console.log("Public URL:", response.secure_url); // ✅ Browser me open karne ke liye

    return response.secure_url;
  } catch (error) {
    if (fs.existsSync(localpath)) fs.unlinkSync(localpath);
    throw error;
  }
};

export { cloudinaryimg };
