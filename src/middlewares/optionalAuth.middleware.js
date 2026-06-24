import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const getOptionalUser = asyncHandler(async (req, res, next) => {
    try {
        // Try to get token from cookies or header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // If no token, just move to the next middleware (user stays undefined)
        if (!token) {
            return next();
        }

        // If there is a token, try to decode it
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        // If user found, attach to request
        if (user) {
            req.user = user;
        }
        next();
    } catch (error) {
        // If token is invalid/expired, we don't throw an error (unlike verifyJWT)
        // We just proceed as a guest
        next();
    }
})