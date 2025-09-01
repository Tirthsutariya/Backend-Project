import {asyncHandler} from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/APIResponse.js"

const registerUser=asyncHandler(async(req,res)=>{

    //get user details from frontend
    //validations-Not empty
    //check user is exist or not
    //check for images and check for avatar
    //upload them to cloudinary,avatar
    //create user objject-create entry in db
    //remove password and refresh token filed in response
    //check for user creation
    //return response



    const {fullname,email,username,password}=req.body;
    console.log(fullname,email,username,password);

    if([fullname, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError("All fields are required",400)
    }

    const existedUser=User.findOne({$or:[{email},{username}]})
    if(existedUser){
        throw new ApiError("User already exists",409)
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    
    if(!avatarLocalPath){
        throw new ApiError("Avatar image is required",400)
    }


    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError("Avatar upload failed",500)
    }

    const user=await User.create({
        fullname,
        email,
        username:username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage.url || ""
    });

    const createdUser=await User.findById(user._id).select("-password -refreshToken ");

    if(!createdUser){
        throw new ApiError("User creation failed",500)
    }

    res.status(201).json(new ApiResponse(createdUser, "User registered successfully", 201));
});


export {registerUser}