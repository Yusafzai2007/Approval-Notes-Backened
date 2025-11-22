import { asynhandler } from "../utils/asynchandler.js";
import { apiErrror } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { classMember } from "../models/classemeber.model.js";
import { Class } from "../models/class.model.js";
import mongoose from "mongoose";

const joinClass = asynhandler(async (req, res) => {
  const { classCode } = req.body;

  if (!classCode) {
    throw new apiErrror(400, "Class code is required");
  }

  const foundClass = await Class.findOne({ classCode });
  if (!foundClass) {
    throw new apiErrror(404, "Invalid class code");
  }

  // Check if record exists for this class
  let classMembers = await classMember.findOne({ classId: foundClass._id });

  // If no record exist, create class entry with this student
  if (!classMembers) {
    classMembers = await classMember.create({
      classId: foundClass._id,
      students: [req.user._id],
    });

    return res
      .status(200)
      .json(new apiResponse(200, "Class joined successfully", classMembers));
  }

  // Check if student already inside array
  if (classMembers.students.includes(req.user._id)) {
    return res
      .status(200)
      .json(new apiResponse(200, "You are already a member", classMembers));
  }

  // Add student to array
  classMembers.students.push(req.user._id);
  await classMembers.save();

  res
    .status(200)
    .json(new apiResponse(200, "Class joined successfully", classMembers));
});

const myClasses = asynhandler(async (req, res) => {
  const joined = await classMember.find({ students: req.user._id }).populate({
    path: "classId",
    select: "ClassName Subject classCode teacher",
    populate: {
      path: "teacher",
      select: "userName email",
    },
  });

  const result = joined.map((item) => {
    const cls = item.classId;

    return {
      classMemberId: item._id,
      classId: cls?._id,
      teacher: cls?.teacher,
      ClassName: cls?.ClassName,
      Subject: cls?.Subject,
      classCode: cls?.classCode,
    };
  });

  res
    .status(200)
    .json(new apiResponse(200, "Your joined classes fetched", result));
});

const classFellows = asynhandler(async (req, res) => {
  const { classId } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(classId)) {
    throw new apiErrror(400, "Invalid Class ID");
  }

  // Check class exists
  const classExists = await Class.findById(classId);
  if (!classExists) {
    throw new apiErrror(404, "Class not found");
  }

  // Find the classMembers document
  const classMembersDoc = await classMember
    .findOne({ classId: new mongoose.Types.ObjectId(classId) })
    .populate("students", "userName email"); // populate the array of students

  if (!classMembersDoc || classMembersDoc.students.length === 0) {
    return res.status(200).json(
      new apiResponse(200, "No students joined yet", {
        classId,
        students: [],
      })
    );
  }

  // Map students array to desired output
  const result = classMembersDoc.students.map((s) => ({
    studentId: s._id,
    name: s.userName,
    email: s.email,
    classId, // add classId here for each student
  }));

  return res
    .status(200)
    .json(new apiResponse(200, "Class students fetched successfully", result));
});

export { joinClass, myClasses, classFellows };
