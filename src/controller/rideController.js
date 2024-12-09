import { driverSockets } from "../websockets/driverlocationWebsocket.js"
import rideModel from "../models/rideModel.js";
import {activeUsers } from "../websockets/userLocationWebsocket.js";

const rideRequestSockets = new Map()

const sendRideRequest = async (req, res) => {
    try {
        const { driver_id, from_lat, from_lng, to_lat, to_lng, fare, status } = req.body;

        console.log(driverSockets.readyState);
        console.log("driverSockets keys:", Array.from(driverSockets.keys()));
        console.log("Requested driver_id:", driver_id);
        if (driverSockets.size == 0) {
            return;
        } else {
            const driverSocket = driverSockets.get(driver_id);


            if (driverSocket.readyState !== 1) {
                return res.status(404).json({ error: "Driver is not available." });
            } else {
                const rows = await rideModel.insertRideRequest(req.body);
                const request_id = rows['rows'][0].request_id;

                driverSocket.send(JSON.stringify({
                    type: "ride_request",
                    data: { request_id, from_lat, from_lng, to_lat, to_lng, fare, status }
                }))

                console.log("Data sent successfully.");
                return res.json({ message: "Ride request sent successfully.", data: request_id });
            }
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
}

const updateRideRequest = async (req, res) => {
    try {
        const result = await rideModel.updateRideRequest(req.body)

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Ride request not found' });
        }
        const driver_id = result['rows'][0].driver_id;
        const user_id = result['rows'][0].user_id;
        const request_id = result['rows'][0].request_id;
        const status = result['rows'][0].status;

        const driverSocket = driverSockets.get(driver_id);
        const userSocket = activeUsers.get(user_id).connection;

        if (driverSocket.readyState !== 1) {
            return res.status(404).json({ error: "Driver is not available." });
        } else {
            driverSocket.send(JSON.stringify({
                type: "ride_request",
                data: { request_id, driver_id, user_id, status }
            }))
        }

        if (userSocket.readyState !== 1) {
            return res.status(404).json({ error: "User is not available" })
        } else {
            userSocket.send(JSON.stringify({
                type: "ride_request",
                data: { request_id, driver_id, user_id, status }
            }))
        }

        return res.status(200).json({ message: 'Update successful', data: result.rows[0] });
    } catch (error) {
        console.log(error)
        res.status(404).json({ message: 'Server error' });

    }
}

export { sendRideRequest, updateRideRequest } 