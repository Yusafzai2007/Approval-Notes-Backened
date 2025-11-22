import mongoose from "mongoose";

const Notesschema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "signup",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    file: {
      type: String,
      required: true,
    },
  status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending",
},

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Notes = mongoose.model("Notes", Notesschema);
