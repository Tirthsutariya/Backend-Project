import { asyncHandler } from "../utils/asynchandler.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"


const verifyJWT= asyncHandler(async (req,res,next)=>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];

    if(!token){
        throw new ApiError("Unauthorized", 401);
    }

    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

    const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError("Invalid access token", 404);
    }

    req.user = user;
    next();
});

export { verifyJWT }