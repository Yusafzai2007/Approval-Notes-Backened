import { asynhandler } from "../utils/asynchandler.js";
import { apiErrror } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Class } from "../models/class.model.js";
import mongoose from "mongoose";
import { Notes } from "../models/notes.model.js";
import { classMember } from "../models/classemeber.model.js";
// Function to generate random 5-character code
function generateClassCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

const createclass = asynhandler(async (req, res) => {
  const { ClassName, Subject } = req.body;

  if (!ClassName || !Subject) {
    throw new apiErrror(400, "ClassName and Subject are required");
  }

  // Auto-generate random class code
  let classCode = generateClassCode();

  // Make sure code is unique
  let exists = await Class.findOne({ classCode });
  while (exists) {
    classCode = generateClassCode();
    exists = await Class.findOne({ classCode });
  }

  const createdClass = await Class.create({
    ClassName,
    Subject,
    classCode, // auto-generated code
    teacher: req.user._id,
  });

  res
    .status(201)
    .json(new apiResponse(201, "Class created successfully", createdClass));
});

const updateClass = asynhandler(async (req, res) => {
  const { id } = req.params; // class id from URL
  const { ClassName, Subject } = req.body;

  if (!id) {
    throw new apiErrror(400, "Class ID is required");
  }

  // Find the class
  const foundClass = await Class.findById(id);

  if (!foundClass) {
    throw new apiErrror(404, "Class not found");
  }

  // Check if logged in teacher owns this class
  if (foundClass.teacher.toString() !== req.user._id.toString()) {
    throw new apiErrror(403, "You are not authorized to update this class");
  }

  // Update fields if provided
  if (ClassName) foundClass.ClassName = ClassName;
  if (Subject) foundClass.Subject = Subject;

  // Save updated class
  const updatedClass = await foundClass.save();

  res
    .status(200)
    .json(new apiResponse(200, "Class updated successfully", updatedClass));
});

const getMyClasses = asynhandler(async (req, res) => {
  // Find classes created by logged-in teacher
  const myClasses = await Class.find({ teacher: req.user._id });

  res
    .status(200)
    .json(new apiResponse(200, "Your classes fetched successfully", myClasses));
});

const deleteClass = asynhandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiErrror(400, "Invalid Class ID");
  }

  const foundClass = await Class.findById(id);
  if (!foundClass) {
    throw new apiErrror(404, "Class not found");
  }

  await Notes.deleteMany({ classId: id });

  await classMember.deleteMany({ classId: id });

  await foundClass.deleteOne();

  res
    .status(200)
    .json(
      new apiResponse(200, "Class and related data deleted successfully", null)
    );
});

export { createclass, updateClass, getMyClasses, deleteClass };
