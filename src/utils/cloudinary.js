    // const cloudinary = require('cloudinary').v2;
    // or
import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret:process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary=async(localfilePath)=>{
    try{
        if(!localfilePath) return null;
        //upload file on cloudinary
        const response=await cloudinary.uploader.upload(localfilePath, {resource_type:"auto"});
        //files has been upload successfully
        // console.log("file is uploaded on cloudinary", response.url)
        fs.unlinkSync(localfilePath)// remove the locallay save temporary file
        return response
    }
    catch(error){
        fs.unlinkSync(localfilePath)// remove the locallay save temporary file as the upload operation is failed
        return null;
    }
}

export {uploadOnCloudinary}


