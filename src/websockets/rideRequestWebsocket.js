
import { driverSockets } from "./driverlocationWebsocket.js"
import express from "express";

const router = express.Router();

const rideRequest = async (app, pool) => {

    app.post('api/user/riderequest', async (req, res) => {

        console.log("Received request: ", req.body);
        try {
            const { user_id, driver_id, current_lat, current_lng, from_lat, from_lng, to_lat, to_lng, status } = JSON.parse(req.body)

            const driverSocket = driverSockets.get(driver_id);
            if (driverSocket != null || driverSocket.readyState !== 1) {
                return res.status(404).json({ error: "Driver is not available." });
            }

            await pool.query(
                `INSERT INTO ride_requests (
                    user_id, driver_id, current_latitude, current_longitude, from_latitude, from_longitude, to_latitude, to_longitude, status
                 ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7,$8,$9
                 ) RETURNING request_id`,
                [user_id, driver_id, current_lat, current_lng, from_lat, from_lng, to_lat, to_lng, status]
            );

            driverSocket.send(JSON.stringify({
                type: "ride_request",
                data: { request_id, user_id, from_lat, from_lng, to_lat, to_lng }
            }))

            return res.json({ message: "Ride request sent successfully." });
        } catch (error) {
            console.log(error);
        }



    })
}

export {rideRequest}