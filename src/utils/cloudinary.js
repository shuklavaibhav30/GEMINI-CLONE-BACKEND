import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"         //File System manage in Node.js

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET_KEY // Click 'View API Keys' above to copy your API secret
});
console.log("Cloudinary config:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY ? "EXISTS" : "MISSING"
});

const uploadOnCloudinary=async function(localFilePath) {
    try{
        if(!localFilePath)  return null;
        const uploadResult = await cloudinary.uploader
       .upload(localFilePath, {resource_type:"auto"})
       //FILE HAS BEEN UPLOADED SUCCESSFULLY
       console.log("File has been uploaded successfully",uploadResult.url);
       fs.unlinkSync(localFilePath);// remove local file after successful upload to cloudinary
       return uploadResult;
       
       
    }catch(error){
           console.log("CLOUDINARY UPLOAD ERROR:", error.message);
           fs.unlinkSync(localFilePath)//remove the locally stored temporary file as the upload operation got failed
           return null;
    };
};  


const deleteFromCloudinary=async (publicId,resourceType="image")=>{
    try{
        if(!publicId)   return null;
        const result=await cloudinary.uploader.destroy(publicId,{
            resource_type:resourceType
        });
        return result;
    }catch(er){
        console.log("Cloudinary DELETION ERROR:",er.message);
        return null;
    }
};

export { uploadOnCloudinary,deleteFromCloudinary };