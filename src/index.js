import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import userRouter from "./routes/userRoutes.js";
import locationRoute from "./routes/locationRoute.js";
import rideRoute from "./routes/rideRoutes.js";
import { driverlocationWebsocket } from "./websockets/driverlocationWebsocket.js"
import { activeDrivers, fetchDriverWithinArea } from "./websockets/userLocationWebsocket.js";


dotenv.config();

const app = express();

const port = process.env.PORT || 3001;

// Middlewares
app.use(express.json());
app.use(cors());

//Routes
app.use('/api/user', userRouter);
app.use('/api/location', locationRoute);
app.use('/api/ride', rideRoute);

// WebSocket Handling
driverlocationWebsocket(app, pool);
fetchDriverWithinArea(app, pool);


//Error handling

// Testing DB
app.get("/", async (req, res) => {
    console.log("Hello world");
    const result = await pool.query("SELECT current_database()");
    res.send(`Database : ${result.rows[0].current_database}`);
})

// Server running
app.listen(port, () => {
    console.log(`server running on ${port}`);
});

