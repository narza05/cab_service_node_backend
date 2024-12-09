import express from "express"
import {sendRideRequest, updateRideRequest} from "../controller/rideController.js"

const router = express.Router()

router.post('/sendRideRequest', sendRideRequest)
router.put('/updateRideRequest', updateRideRequest)

export default router;