import pool from "../config/db.js"

const updateDriverLocation = async ({ driver_id, lat, lng, status }) => {
    if (!driver_id || !lat || !lng || !status) {
        return res.status(400).json({ error: 'driver_id, lat, lng and status are required.' });
    }
    const result = await pool.query('INSERT INTO driver_locations (driver_id, latitude, longitude, status) VALUES ($1,$2,$3,$4)', [driver_id, lat, lng, status]);
    return result;
}

export default { updateDriverLocation }