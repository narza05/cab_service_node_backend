
import User from "../models/userModel.js";
import { activeDrivers } from "../websockets/userLocationWebsocket.js";


const createUser = async (req, res) => {
    const { mobile, name, type } = req.body;
    try {
        await User.createUser({ mobile, name, type });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
}

const updateDriverStatus = async (req, res) => {
    try {
        const { user_id, status } = req.body;

        await User.updateDriverStatus(req.body);

        const userQuery = `
            SELECT name
            FROM users
            WHERE user_id = $1;
        `;
        const userResult = await pool.query(userQuery, [user_id]);

        // Combine the data
        const combinedResult = {
            user_id: user_id, status: status,
            driver_name: userResult.rows[0]?.driver_name
        };

        if (activeDrivers.has(user_id)) {
            const userSockets = activeDrivers.get(user_id);
            userSockets.forEach(userWs => {
                if (userWs.readyState === 1) {
                    console.log("sending status update to user");
                    userWs.send(JSON.stringify({
                        type: "driver_status_update",
                        data: combinedResult
                    }));
                }
            });
        }

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
}

export default { createUser, updateDriverStatus };