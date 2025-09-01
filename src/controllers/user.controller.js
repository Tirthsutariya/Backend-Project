import {asyncHandler} from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/APIResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError("Token generation failed", 500);
    }

    return { accessToken, refreshToken };
};

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

    const existedUser=await User.findOne({$or:[{email},{username}]})
    if(existedUser){
        throw new ApiError("User already exists",409)
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath = undefined;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    
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

    const createdUser=await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError("User creation failed",500)
    }

    res.status(201).json(new ApiResponse(createdUser, "User registered successfully", 201));
});


const loginUser = asyncHandler(async (req, res) => {
    //take email and password from user body
    //check that email is present in db or not
    //find user
    //check password
    //access and refresh token
    //send cookies

    const { email, password } = req.body;

    if(!email || !password){
        throw new ApiError("Email and password are required", 400);
    }

    const user = await User.findOne({ email });
    if(!user){
        throw new ApiError("Invalid email or password", 401);
    }

    const isPasswordValid=await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError("Invalid password", 401);
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options={
        httpOnly:true,
        secure:true
    }

   res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse({user:loggedInUser,accessToken,refreshToken}, "User logged in successfully", 200));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true, useFindAndModify: false });

    const options={
        httpOnly:true,
        secure:true
    }

   res.status(200).clearCookie("accessToken", "", options).clearCookie("refreshToken", "", options).json(new ApiResponse(null, "User logged out successfully", 200));
});


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError("Unauthorized Request", 400);
    }

    const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    user=await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError("Invalid refreshtoken", 400);
    }

    if(incomingRefreshToken!=user?.refreshToken){
        throw new ApiError("Refresh Token is expired or used", 400);
    }

    const { accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    const options={
        httpOnly:true,
        secure:true
    }
    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(new ApiResponse({ accessToken }, "Access token refreshed successfully", 200));
});


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError("User not found", 404);
    }

    const isOldPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isOldPasswordValid) {
        throw new ApiError("Old password is incorrect", 401);
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(new ApiResponse(null, "Password changed successfully", 200));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken");
    if (!user) {
        throw new ApiError("User not found", 404);
    }
    res.status(200).json(new ApiResponse(user, "Current user fetched successfully", 200));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;



    User.findByIdAndUpdate(req.user._id, { $set: { fullname, email } }, { new: true, useFindAndModify: false }).select("-password -refreshToken");

    res.status(200).json(new ApiResponse(null, "Account details updated successfully", 200));
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError("Avatar image is required", 400);
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const user = await User.findByIdAndUpdate(req.user._id, { $set: { avatar } }, { new: true, useFindAndModify: false }).select("-password -refreshToken");

    res.status(200).json(new ApiResponse(user, "Avatar updated successfully", 200));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError("Cover image is required", 400);
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const user = await User.findByIdAndUpdate(req.user._id, { $set: { coverImage } }, { new: true, useFindAndModify: false }).select("-password -refreshToken");

    res.status(200).json(new ApiResponse(user, "Cover image updated successfully", 200));
});

export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateUserCoverImage}