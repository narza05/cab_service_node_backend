import pool from "../config/db.js";

const ride_requests = "ride_requests";

const insertRideRequest = async (req, res) => {
    const { user_id, driver_id, current_lat, current_lng, from_lat, from_lng, to_lat, to_lng, fare, status } = req

    const result = pool.query("INSERT INTO ride_requests (request_id, user_id, driver_id, current_latitude, current_longitude, from_latitude, from_longitude, to_latitude, to_longitude, fare, status) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING request_id",
        [user_id, driver_id, current_lat, current_lng, from_lat, from_lng, to_lat, to_lng, fare, status]);

    return result;
}

const updateRideRequest = async (req, res) => {
    const { request_id, status } = req; // Correctly extract data from req.body
    // Validate input
    if (!request_id || !status) {
        return res.status(400).json({ message: 'Missing request_id or status' });
    }
    try {
        const result = await pool.query(
            "UPDATE ride_requests SET status = $1 WHERE request_id = $2 RETURNING *",
            [status, request_id]
        );
        return result
    } catch (error) {
        console.error("Error updating ride request:", error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


export default { insertRideRequest, updateRideRequest };