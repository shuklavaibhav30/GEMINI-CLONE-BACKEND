import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const cookieOptions={
    httpOnly:true,
    secure:true,
    sameSite:'None'
}

const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh Tokens!!!")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    const { fullName,email,password }=req.body
    console.log("Email: ",email)

    if(
        [fullName,email,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All Fields are compulsary!")
    }
    const existedUser=await User.findOne({
        $or:[{ email }]
    })
    if(existedUser){
        throw new ApiError(409,"User with email already exists!")
    }
    const avatarLocalPath=req.files?.avatar?.[0]?.path;
    console.log("req.files: ",req.files);
    const avatar=await uploadOnCloudinary(avatarLocalPath)

    const user=await User.create({
        fullName,
        avatar:avatar.url,
        email,
        password
    })
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the User!")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully!!!")
    )
    
    
})

const loginUser=asyncHandler(async(req,res)=>{
    const {email,password}=req.body
    if(!email) throw new ApiError(400,"Email is required!");
    const user=await User.findOne({
        email
    })
    if(!user) throw new ApiError(404,"User do not exist!");
    const isPasswordValid=await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"PASSWORD INCORRECT!!!")
    }
    const { accessToken,refreshToken }=await generateAccessAndRefreshTokens(user._id)
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    
    return res.status(200)
    .cookie("accessToken",accessToken,cookieOptions)
    .cookie("refreshToken",refreshToken,cookieOptions)
    .json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,refreshToken
        },"User Logged in Successfully!")
    )
})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    return res.status(200)
    .clearCookie("accessToken",cookieOptions)
    .clearCookie("refreshToken",cookieOptions)
    .json(new ApiResponse(200,{},"User logged out successfully!"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken   //(if someone uses mobile)

    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized Token")
        
    }
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
    
       const user=await User.findById(decodedToken?._id)
       if(!user){
        throw new ApiError(401,"Invalid Refresh Token")
       }
       if (incomingRefreshToken!=user?.refreshToken) {
        throw new ApiError(401,"REFRESH TOKEN IS EXPIRED OR USED!!!")
        
       }
    
       const{accessToken:newaccessToken,refreshToken:newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
       return res
       .status(200)
       .cookie("accessToken",newaccessToken,cookieOptions)
       .cookie("refreshToken",newrefreshToken,cookieOptions)
       .json(
        new ApiResponse(
            200,
            {
                accessToken:newaccessToken,refreshToken:newrefreshToken
            },
            "Access Token Refreshed!"
        )
       )
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid refresh Token")
        }
    
})


export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
}