import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images"); // local save
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // keep the original filename
  },
});

export const upload = multer({ storage });
