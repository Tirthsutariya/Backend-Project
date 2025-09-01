import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(cookieParser());
app.use(express.json({
    limit:"10mb"
}));
app.use(express.urlencoded({
    extended:true
}))
app.use(express.static("public"));


//routes
import userRouter from "./routes/users.route.js";

app.use("/api/v1/users", userRouter);

export default app;
