import expressWs from "express-ws";

const activeUsers = new Map();
const activeDrivers = new Map();

const fetchDriverWithinArea = async (app, pool) => {
    expressWs(app);

    app.ws('/api/user/fetchDriver', (ws, req) => {

        ws.on("message", async (msg) => {
            const { user_id, lat, lng } = JSON.parse(msg);
            console.log(lat);
            console.log(lng);

            try {
                // Query drivers within 10 km radius
                const result = await pool.query(
                    `SELECT DISTINCT ON (dl.driver_id) 
                        dl.driver_id, 
                        dl.latitude, 
                        dl.longitude, 
                        ds.status, 
                        u.name AS driver_name, 
                        dl.timestamp
                    FROM 
                        driver_locations dl
                    JOIN 
                        driver_status ds 
                    ON 
                        dl.driver_id = ds.driver_id
                    JOIN 
                        users u
                    ON 
                        dl.driver_id = u.user_id
                    WHERE 
                        ds.status = 'available' 
                        AND (6371 * acos(
                                cos(radians($1)) * cos(radians(dl.latitude)) * 
                                cos(radians(dl.longitude) - radians($2)) + 
                                sin(radians($1)) * sin(radians(dl.latitude))
                            )) <= 10
                    ORDER BY 
                        dl.driver_id, 
                        dl.timestamp DESC
                    LIMIT 10;`,
                    [lat, lng]
                );

                console.error("result length", result.rows.length);

                // Map driver details including driver_name
                const drivers = result.rows.map(row => ({
                    driver_id: row.driver_id,
                    lat: row.latitude,
                    lng: row.longitude,
                    status: row.status,
                    driver_name: row.driver_name
                }));
                const driverIds = result.rows.map(row => row.driver_id);

                // Save user and their subscribed drivers
                activeUsers.set(user_id, { connection: ws, drivers: driverIds });

                // Add this user to each driver's subscriber list
                driverIds.forEach(driverId => {
                    if (!activeDrivers.has(driverId)) {
                        activeDrivers.set(driverId, []);
                    }
                    activeDrivers.get(driverId).push(ws);
                });

                ws.send(JSON.stringify({
                    type: "all_driver_location_update",
                    data: drivers
                }));
                console.error("all_driver_location_update sent:", drivers.length);

            } catch (err) {
                console.error("Error fetching nearby drivers:", err);
                ws.send(JSON.stringify({ error: "Failed to fetch drivers." }));
            }
        });

        ws.on("close", () => {
            console.log(`WebSocket connection for user closed`);

            // Remove user from activeUsers and unsubscribe them from drivers
            activeUsers.forEach((value, key) => {
                if (value.connection === ws) {
                    activeUsers.delete(key);

                    // Remove the user from each driver's subscriber list
                    value.drivers.forEach(driverId => {
                        if (activeDrivers.has(driverId)) {
                            const subscribers = activeDrivers.get(driverId).filter(sub => sub !== ws);
                            activeDrivers.set(driverId, subscribers);

                            // Clean up drivers with no subscribers
                            if (subscribers.length === 0) {
                                activeDrivers.delete(driverId);
                            }
                        }
                    });
                }
            });
        });
    });
};

export { activeUsers, activeDrivers, fetchDriverWithinArea };
