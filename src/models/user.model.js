import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        required: true

    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type:String, //cloudinary url
        required: true
    },
    coverImage:{
        type:String, //cloudinary url
        required: true
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"

        }
    ],
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    }

},{timestamps:true});


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    
    return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
    const token = jwt.sign({ _id: this._id, email:this.email, username:this.username}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
    return token;
};
userSchema.methods.generateRefreshToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
    return token;
};

export const User = mongoose.model("User", userSchema);


