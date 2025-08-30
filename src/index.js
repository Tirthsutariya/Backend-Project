// require('dotenv').config()

import dotenv from "dotenv";
dotenv.config({
    path:'./.env'
});

import express from "express";
import connectDB from "./db/index.js";

connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.error("Database connection failed:", error);
});
