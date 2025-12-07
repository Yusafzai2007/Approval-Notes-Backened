import mongoose from "mongoose";

const classschema = new mongoose.Schema(
  {
  ClassName: {
      type: String,
      required: true,  
    },
    Subject: {
      type: String,
      required: true,
    },
    classCode: {
      type: String,
      required: true,
      unique:true
    },
    teacher:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"signup",
      required:true
    },
    
  },
  { timestamps: true }
);


export const Class = mongoose.model("Class", classschema);
