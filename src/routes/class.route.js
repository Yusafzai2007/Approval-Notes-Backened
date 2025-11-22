import { Router } from "express";
import {
  createclass,
  deleteClass,
  getMyClasses,
  updateClass,
} from "../controllers/class.controller.js";
import { jwtverify } from "../middlewares/auth.middleware.js";
import {
  classFellows,
  joinClass,
  myClasses,
} from "../controllers/classMember.controller.js";
import {
  deleteNote,
  editNote,
  getMyNotes,
  getNotesByUser,
  getNotesByUserAndClass,
  updateNoteStatus,
  uploadNote,
} from "../controllers/uploadNotes.controller.js";
import { upload } from "../middlewares/multer.midlleware.js";
import { logoutuser } from "../controllers/user.controller.js";

const route = Router();

route.post("/class-create", jwtverify, createclass);
route.post("/edit-class/:id", jwtverify, updateClass);

////// join-class

route.post("/join-class", jwtverify, joinClass);

route.get("/get-classfellow", jwtverify, myClasses);

route.get("/get-My-class-students/:classId", jwtverify, classFellows);

route.get("/get-Myclasses", jwtverify, getMyClasses);

route.post(
  "/upload-Notes",
  jwtverify,
  upload.fields([
    {
      name: "file",
      maxCount: 1,
    },
  ]),
  uploadNote
);

route.post(
  "/edit-notes/:id",
  jwtverify,
  upload.fields([
    {
      name: "file",
      maxCount: 1,
    },
  ]),
  editNote
);

route.get("/getMyNotes", jwtverify, getMyNotes);
route.get("/getNotesByUser/:userId", jwtverify, getNotesByUser);

route.post("/update-class-notes/:id", jwtverify, updateNoteStatus);

route.post("/deleteNote/:id", jwtverify, deleteNote);

route.post("/logout", jwtverify, logoutuser);

route.get("/user/:userId/class/:classId", jwtverify,getNotesByUserAndClass);






route.delete("/deleteClass/:id",deleteClass)




export default route;
