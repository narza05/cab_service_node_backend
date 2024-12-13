import pkg from 'pg';
const { Pool } = pkg;

import dotenv from "dotenv";

dotenv.config();
const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.DBPORT,
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 5000,
    ssl: {
        rejectUnauthorized: false, // Use true if you have a valid certificate
    },
})

pool.on("connect",()=>{
    console.log("connection pool established.")
})

export default pool;