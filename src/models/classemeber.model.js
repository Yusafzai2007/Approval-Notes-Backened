import mongoose from "mongoose";

const classMemberSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
    unique: true      
  },

  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "signup"
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const classMember = mongoose.model("classMember", classMemberSchema);
