import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema=new Schema({
    email:{
        required:true,
        type:String,
        trim:true,
        lowercase:true,
        unique:true
    },
    fullName:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,
        required:true
    },
    googleId:{
        type:String,
        unique:true,
        sparse:true
    },
    refreshToken:{
        type:String
    },
    password:{
        type:String,
        required:function(){
            return !this.googleId
        }
    }
},{timestamps:true})


userSchema.pre(
    "save",async function(next){
        if(!this.isModified("password")){
            return next();
        }
        this.password=await bcrypt.hash(this.password,10);
        next();
    }
)

//for checking of correct password or not

userSchema.methods.isPasswordCorrect=async function(password){
    if(!this.password)  return false;
    return await bcrypt.compare(password,this.password)
}


userSchema.methods.generateAccessToken=function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
}


userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this._id
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}


export const User=mongoose.model("User",userSchema)