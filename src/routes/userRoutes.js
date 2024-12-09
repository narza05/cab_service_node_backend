import express from "express";
import user from "../controller/userController.js";
const router = express.Router();

router.post('/createUser', user.createUser);
router.post('/updateDriverStatus', user.updateDriverStatus);
// router.post('/login', login);

export default router;