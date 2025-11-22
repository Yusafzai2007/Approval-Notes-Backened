import { asynhandler } from "../utils/asynchandler.js";
import { apiErrror } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Notes } from "../models/notes.model.js";
import { cloudinaryimg } from "../utils/cloudinaryimg.js";
import { classMember } from "../models/classemeber.model.js"; // 👈 Add this
import { Class } from "../models/class.model.js"; // 👈 Make sure Class is imported

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

  // ✅ Correct file access
  const localimg = req.files?.file[0].path;
  if (!localimg) throw new apiErrror(400, "File is required");

  const uploadimg = await cloudinaryimg(localimg);
  if (!uploadimg) throw new apiErrror(500, "Cloudinary upload failed");

  const note = await Notes.create({
    classId: classData._id,
    userId: req.user._id,
    title,
    description,
    file: uploadimg, // Cloudinary URL
  });

  res.status(201).json(new apiResponse(201, "Note uploaded, waiting for approval", note));
});


const editNote = asynhandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, className } = req.body;

  // Step 1: Find the note
  const note = await Notes.findById(id);
  if (!note) {
    throw new apiErrror(404, "Note not found");
  }

  // Step 2: Check if the user is the owner of the note
  if (note.userId.toString() !== req.user._id.toString()) {
    throw new apiErrror(403, "You cannot edit this note");
  }

  let classData = null;

  // Step 3: If className is provided, validate class and check membership
  if (className) {
    classData = await Class.findOne({ ClassName: className });
    if (!classData) {
      throw new apiErrror(404, "Class not found");
    }

    // Check if user has joined this class
    const joinedClass = await classMember.findOne({
      classId: classData._id,
      students: req.user._id,
    });

    if (!joinedClass) {
      return res
        .status(403)
        .json(new apiResponse(403, "You have not joined this class", null));
    }

    // Update classId in note
    note.classId = classData._id;
  }

  // Step 4: Update fields if provided
  if (title) note.title = title;
  if (description) note.description = description;

  // Update status if provided and valid
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    note.status = status;
  }

  // Step 5: Update file if uploaded
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

// ✅ Update status API
const updateNoteStatus = asynhandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // 1️⃣ Validate status
  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    throw new apiErrror(
      400,
      "Invalid status. Allowed values: pending, approved, rejected"
    );
  }

  // 2️⃣ Find the note
  const note = await Notes.findById(id);
  if (!note) {
    throw new apiErrror(404, "Note not found");
  }

  // 3️⃣ Check permissions: student owner or teacher
  if (
    note.userId.toString() !== req.user._id.toString() &&
    req.user.role !== "Teacher"
  ) {
    throw new apiErrror(
      403,
      "You do not have permission to update this note status"
    );
  }

  // 4️⃣ Update the status
  note.status = status;
  await note.save();

  res
    .status(200)
    .json(new apiResponse(200, "Note status updated successfully", note));
});

const getMyNotes = asynhandler(async (req, res) => {
  const userId = req.user._id;

  // Find notes and populate classId to include ClassName and Subject
  const notes = await Notes.find({ userId }).populate(
    "classId",
    "ClassName Subject"
  ); // Only get these fields from Class

  // Transform notes to include all original fields + ClassName and Subject + explicit _id
  const formattedNotes = notes.map((note) => ({
    _id: note._id.toString(), // 🔥 convert ObjectId to string
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

  // Step 1: Find the note
  const note = await Notes.findById(id);
  if (!note) {
    throw new apiErrror(404, "Note not found");
  }

  // Step 2: Check if the user is the owner of the note
  if (note.userId.toString() !== req.user._id.toString()) {
    throw new apiErrror(403, "You cannot delete this note");
  }

  // Step 3: Delete the note
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
    _id: note._id.toString(), // explicit _id as string
    userId: note.userId.toString(), // optional, useful if needed
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

  // Fetch notes by userId and classId
  const notes = await Notes.find({ userId, classId }).populate(
    "classId",
    "ClassName Subject"
  );

  // Format notes
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
