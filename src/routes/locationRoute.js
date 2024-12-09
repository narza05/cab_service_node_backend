import express from "express"
import locationController from "../controller/locationController.js"

const router = express.Router()

router.post('/updateLocation', locationController.updateDriverLocation);

export default router;
