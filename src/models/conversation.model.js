import mongoose,{Schema} from "mongoose";

const messageSchema=new Schema({
    role:{
        type:String,
        enum:["user","model"],
        required:true
    },
    text:{
        type:String,
        required:true
    }
},{timestamps:true})


const conversationSchema=new Schema({
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    messages:[
        messageSchema
    ],
    title:{
        type:String,
        default:"New Chat"
    }
},{timestamps:true})

export const Conversation=mongoose.model("Conversation",conversationSchema)