// require('dotenv').config()

import dotenv from "dotenv";
dotenv.config({
    path:'./.env'
});

import connectDB from "./db/index.js";
import app from "./app.js";

// connectDB and server start
connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.error("Database connection failed:", error);
});

