// import expressWs from "express-ws";
// import { activeDrivers } from "../websockets/userLocationWebsocket.js";
// import user from "../controller/userController.js";

// const driverSockets = new Map();
// const locationUpdates = []; 

// const driverlocationWebsocket = (app, pool) => {
//     const expressWsInstance = expressWs(app, null, {
//         wsOptions: {
//             maxPayload: 1024 * 1024 * 10, // Set payload size to 10 MB
//         },
//     });// Enable WebSocket support


//     setInterval(async () => {
//         if (locationUpdates.length > 0) {
//             try {
//                 const values = locationUpdates
//                     .map((update) => `('${update.driver_id}', ${update.lat}, ${update.lng})`)
//                     .join(", ");
//                 const query = `
//                     INSERT INTO driver_locations (driver_id, latitude, longitude)
//                     VALUES ${values}
//                 `;
//                 await pool.query(query);
//                 console.log(`Inserted ${locationUpdates.length} driver location updates.`);
//                 locationUpdates.length = 0; // Clear the cache
//             } catch (error) {
//                 console.error("Error writing batch location updates to the database:", error);
//             }
//         }
//     }, 5000); 

//     app.ws('/api/driver/updateLocation', (ws, req) => {
//         console.log("Driver WebSocket connection established");
//         let driverData = {};
//         ws.on("message", async (msg) => {
//             console.log("Received WebSocket message:", msg);

//             try {
//                 const { driver_id, lat, lng } = JSON.parse(msg);

//                 if (!driver_id || !lat || !lng) {
//                     ws.send(JSON.stringify({ error: "Invalid data format." }));
//                     return;
//                 }

//                 driverData = { driver_id, lat, lng };
//                 driverSockets.set(driver_id, ws);
//                 locationUpdates.push({ driver_id, lat, lng });
                
//                 // Update driver location in the database
//                 // await pool.query(
//                 //     "INSERT INTO driver_locations (driver_id, latitude, longitude) VALUES ($1,$2,$3)",
//                 //     [driver_id, lat, lng]
//                 // );

//                 const userQuery = `
//                     SELECT name AS driver_name
//                     FROM users
//                     WHERE user_id = $1;
//                 `;
//                 const userResult = await pool.query(userQuery, [driver_id]);
//                 // Notify all subscribed users of this driver about the new location
//                 if (activeDrivers.has(driver_id)) {
//                     const userSockets = activeDrivers.get(driver_id);
//                     userSockets.forEach(userWs => {
//                         if (userWs.readyState === 1) {
//                             console.log("sending location to user");
//                             userWs.send(JSON.stringify({
//                                 type: "driver_location_update",
//                                 data: { driver_id, lat, lng, driver_name: userResult.rows[0]?.driver_name }
//                             }));
//                         }
//                     });
//                 }
//                 console.log("Location updated successfully.", msg);
//                 ws.send(JSON.stringify({ message: "Location updated successfully." }));
//             } catch (error) {
//                 console.error("Error handling WebSocket message:", error);
//                 ws.send(JSON.stringify({ error: "Failed to process location update." }));
//             }
//         });

//         ws.on("close", async () => {
//             console.log("Driver WebSocket connection closed");
//             try {
//                 const { driver_id, lat, lng } = driverData;
//                 if (driver_id) {
//                     // Update driver status to 'unavailable' in the database with the last known location
//                     const result = await pool.query("INSERT INTO driver_status (driver_id, status) VALUES ($1, $2) RETURNING *", [driver_id, "unavailable"])
//                     if (activeDrivers.has(driver_id)) {
//                         const userSockets = activeDrivers.get(driver_id);
//                         userSockets.forEach(userWs => {
//                             if (userWs.readyState === 1) {
//                                 console.log("sending location to user");
//                                 userWs.send(JSON.stringify({
//                                     type: "driver_status_update",
//                                     data: { user_id: driver_id, status: "unavailable" }
//                                 }));
//                             }
//                         });
//                     }

//                     // await pool.query(
//                     //     "INSERT INTO driver_locations (driver_id, latitude, longitude) VALUES ($1, $2, $3)",
//                     //     [driver_id, lat, lng]
//                     // );

//                     console.log(`Driver ${driver_id} marked as unavailable with location (${lat}, ${lng}).`);
//                 }
//             } catch (error) {
//                 console.error("Error updating driver status on disconnection:", error);
//             }
//         });
//     });
// };
// export { driverlocationWebsocket, driverSockets };


import expressWs from "express-ws";
import { activeDrivers } from "../websockets/userLocationWebsocket.js";
import user from "../controller/userController.js";

const driverSockets = new Map();
const locationUpdates = []; 

const driverlocationWebsocket = (app, pool) => {
    const expressWsInstance = expressWs(app, null, {
        wsOptions: {
            maxPayload: 1024 * 1024 * 10, // Set payload size to 10 MB
        },
    });// Enable WebSocket support

    setInterval(async () => {
        if (locationUpdates.length > 0) {
            try {
                const values = locationUpdates
                    .map((update) => `('${update.driver_id}', ${update.lat}, ${update.lng})`)
                    .join(", ");
                const query = `
                    INSERT INTO driver_locations (driver_id, latitude, longitude)
                    VALUES ${values}
                `;
                await pool.query(query);
                console.log(`Inserted ${locationUpdates.length} driver location updates.`);
                locationUpdates.length = 0; // Clear the cache
            } catch (error) {
                console.error("Error writing batch location updates to the database:", error);
            }
        }
    }, 5000); 

    app.ws('/api/driver/updateLocation', (ws, req) => {
        console.log("Driver WebSocket connection established");

        let driverData = {};
        ws.on("message", async (msg) => {
            console.log("Received WebSocket message:", msg);
            
            // Log message size (in bytes)
            const messageSize = Buffer.byteLength(msg, 'utf8');
            console.log(`Message size: ${messageSize} bytes`);
            
            // Check if the message exceeds maxPayload
            if (messageSize > 1024 * 1024 * 10) {
                console.warn(`Message exceeds maxPayload! Size: ${messageSize} bytes`);
                ws.send(JSON.stringify({ error: "Payload too large." }));
                return;
            }

            try {
                const { driver_id, lat, lng } = JSON.parse(msg);

                if (!driver_id || !lat || !lng) {
                    ws.send(JSON.stringify({ error: "Invalid data format." }));
                    return;
                }

                driverData = { driver_id, lat, lng };
                driverSockets.set(driver_id, ws);
                locationUpdates.push({ driver_id, lat, lng });

                const userQuery = `
                    SELECT name AS driver_name
                    FROM users
                    WHERE user_id = $1;
                `;
                const userResult = await pool.query(userQuery, [driver_id]);

                if (activeDrivers.has(driver_id)) {
                    const userSockets = activeDrivers.get(driver_id);
                    userSockets.forEach(userWs => {
                        if (userWs.readyState === 1) {
                            console.log("sending location to user");
                            userWs.send(JSON.stringify({
                                type: "driver_location_update",
                                data: { driver_id, lat, lng, driver_name: userResult.rows[0]?.driver_name }
                            }));
                        }
                    });
                }

                console.log("Location updated successfully.", msg);
                ws.send(JSON.stringify({ message: "Location updated successfully." }));
            } catch (error) {
                console.error("Error handling WebSocket message:", error);
                ws.send(JSON.stringify({ error: "Failed to process location update." }));
            }
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });

        ws.on("close", async () => {
            console.log("Driver WebSocket connection closed");
            try {
                const { driver_id, lat, lng } = driverData;
                if (driver_id) {
                    const result = await pool.query("INSERT INTO driver_status (driver_id, status) VALUES ($1, $2) RETURNING *", [driver_id, "unavailable"]);

                    if (activeDrivers.has(driver_id)) {
                        const userSockets = activeDrivers.get(driver_id);
                        userSockets.forEach(userWs => {
                            if (userWs.readyState === 1) {
                                console.log("sending location to user");
                                userWs.send(JSON.stringify({
                                    type: "driver_status_update",
                                    data: { user_id: driver_id, status: "unavailable" }
                                }));
                            }
                        });
                    }

                    console.log(`Driver ${driver_id} marked as unavailable with location (${lat}, ${lng}).`);
                }
            } catch (error) {
                console.error("Error updating driver status on disconnection:", error);
            }
        });

        ws.on("ping", () => {
            console.log("Received ping, sending pong.");
            ws.pong(); // Respond to ping to keep the connection alive
        });

        ws.on("pong", () => {
            console.log("Pong received from client.");
        });
    });
};

export { driverlocationWebsocket, driverSockets };
