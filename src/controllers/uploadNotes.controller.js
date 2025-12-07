import { asynhandler } from "../utils/asynchandler.js";
import { apiErrror } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Notes } from "../models/notes.model.js";
import { cloudinaryimg } from "../utils/cloudinaryimg.js";
import { classMember } from "../models/classemeber.model.js"; 
import { Class } from "../models/class.model.js"; 

const uploadNote = asynhandler(async (req, res) => {
  const { title, description, className } = req.body;

  if (!className) {
    throw new apiErrror(400, "Class name is required");
  }

  const classData = await Class.findOne({ ClassName: className });
  if (!classData) throw new apiErrror(404, "Class not found");

  const joinedClass = await classMember.findOne({
    classId: classData._id,
    students: req.user._id,
  });
  if (!joinedClass)
    return res.status(403).json(new apiResponse(403, "You have not joined this class", null));

  const localimg = req.files?.file[0].path;
  if (!localimg) throw new apiErrror(400, "File is required");

  const uploadimg = await cloudinaryimg(localimg);
  if (!uploadimg) throw new apiErrror(500, "Cloudinary upload failed");

  const note = await Notes.create({
    classId: classData._id,
    userId: req.user._id,
    title,
    description,
    file: uploadimg,
  });

  res.status(201).json(new apiResponse(201, "Note uploaded, waiting for approval", note));
});


const editNote = asynhandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, className } = req.body;

  const note = await Notes.findById(id);
  if (!note) {
    throw new apiErrror(404, "Note not found");
  }

  if (note.userId.toString() !== req.user._id.toString()) {
    throw new apiErrror(403, "You cannot edit this note");
  }

  let classData = null;

  if (className) {
    classData = await Class.findOne({ ClassName: className });
    if (!classData) {
      throw new apiErrror(404, "Class not found");
    }

    const joinedClass = await classMember.findOne({
      classId: classData._id,
      students: req.user._id,
    });

    if (!joinedClass) {
      return res
        .status(403)
        .json(new apiResponse(403, "You have not joined this class", null));
    }

    note.classId = classData._id;
  }

  if (title) note.title = title;
  if (description) note.description = description;

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    note.status = status;
  }

  const newFile = req.files?.file?.[0]?.path;
  if (newFile) {
    const uploadedFile = await cloudinaryimg(newFile);
    if (!uploadedFile) {
      throw new apiErrror(500, "Failed to upload file");
    }
    note.file = uploadedFile.url;
  }

  await note.save();

  res.status(200).json(new apiResponse(200, "Note updated successfully", note));
});

const updateNoteStatus = asynhandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    throw new apiErrror(
      400,
      "Invalid status. Allowed values: pending, approved, rejected"
    );
  }

  const note = await Notes.findById(id);
  if (!note) {
    throw new apiErrror(404, "Note not found");
  }

  if (
    note.userId.toString() !== req.user._id.toString() &&
    req.user.role !== "Teacher"
  ) {
    throw new apiErrror(
      403,
      "You do not have permission to update this note status"
    );
  }

  note.status = status;
  await note.save();

  res
    .status(200)
    .json(new apiResponse(200, "Note status updated successfully", note));
});

const getMyNotes = asynhandler(async (req, res) => {
  const userId = req.user._id;

  const notes = await Notes.find({ userId }).populate(
    "classId",
    "ClassName Subject"
  ); 

  const formattedNotes = notes.map((note) => ({
    _id: note._id.toString(), 
    userId: note.userId.toString(),
    classId: note.classId?._id.toString() || null,
    title: note.title,
    description: note.description,
    file: note.file,
    status: note.status,
    uploadedAt: note.uploadedAt,
    ClassName: note.classId?.ClassName || "",
    Subject: note.classId?.Subject || "",
  }));

  res
    .status(200)
    .json(new apiResponse(200, "Your uploaded notes", formattedNotes));
});

const deleteNote = asynhandler(async (req, res) => {
  const { id } = req.params;

  const note = await Notes.findById(id);
  if (!note) {
    throw new apiErrror(404, "Note not found");
  }

  if (note.userId.toString() !== req.user._id.toString()) {
    throw new apiErrror(403, "You cannot delete this note");
  }

  await note.deleteOne();

  res.status(200).json(new apiResponse(200, "Note deleted successfully", null));
});

const getNotesByUser = asynhandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiErrror(400, "User ID is required");
  }

  const notes = await Notes.find({ userId }).populate(
    "classId",
    "ClassName Subject"
  );

  const formattedNotes = notes.map((note) => ({
    _id: note._id.toString(), 
    userId: note.userId.toString(), 
    classId: note.classId?._id.toString() || null,
    title: note.title,
    description: note.description,
    status: note.status,
    file: note.file,
    uploadedAt: note.uploadedAt,
    ClassName: note.classId?.ClassName || "",
    Subject: note.classId?.Subject || "",
  }));

  res
    .status(200)
    .json(
      new apiResponse(200, `Notes uploaded by user ${userId}`, formattedNotes)
    );
});

const getNotesByUserAndClass = asynhandler(async (req, res) => {
  const { userId, classId } = req.params;

  if (!userId || !classId) {
    throw new apiErrror(400, "Both userId and classId are required");
  }

  // Check if class exists
  const classData = await Class.findById(classId);
  if (!classData) {
    throw new apiErrror(404, "Class not found");
  }

  const notes = await Notes.find({ userId, classId }).populate(
    "classId",
    "ClassName Subject"
  );

  const formattedNotes = notes.map((note) => ({
    _id: note._id.toString(),
    userId: note.userId.toString(),
    classId: note.classId?._id.toString() || null,
    title: note.title,
    description: note.description,
    file: note.file,
    status: note.status,
    uploadedAt: note.uploadedAt,
    ClassName: note.classId?.ClassName || "",
    Subject: note.classId?.Subject || "",
  }));

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        `Notes uploaded by user ${userId} in this class`,
        formattedNotes
      )
    );
});

export {
  uploadNote,
  editNote,
  getMyNotes,
  getNotesByUser,
  deleteNote,
  updateNoteStatus,
  getNotesByUserAndClass,
};
