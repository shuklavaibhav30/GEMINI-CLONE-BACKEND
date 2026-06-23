import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Conversation } from "../models/conversation.model.js";
import { isValidObjectId } from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model=genAI.getGenerativeModel({model:"gemini-2.0-flash"})


const sendMessage=asyncHandler(async(req,res)=>{
    const { conversationId }=req.params;
    const { message }=req.body;
    if(conversationId!="new" && !isValidObjectId(conversationId)){
        throw new ApiError(400,"Invalid Conversation ID!");
    }
    if(!message?.trim()){
        throw new ApiError(400,"Enter message!!!")
    }
    let conversation;
    if(conversationId==="new"){
        conversation=await Conversation.create({
            owner:req.user._id,
            messages:[],
            title:message.slice(0,40)
        })
    }else{
        conversation=await Conversation.findOne({
            _id:conversationId,
            owner:req.user._id
        })
    }
    if(!conversation){
        throw new ApiError(404,"Conversation not found!")
    }
    conversation.messages.push({
        role:"user",
        text:message
    })
    const history=conversation.messages.slice(0,-1)

    //formatted history to make gemini better understandable for the convo
    const formattedHistory=history.map((msg)=>({
        role:msg.role,
        parts:[{text:msg.text}]
    }))

    //chat session
    const chat=model.startChat({history:formattedHistory})
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()
    let fullResponse=""
    try {
        const result=await chat.sendMessageStream(message)

        //now reading the response in chunk by chunk form
        for await(const chunk of result.stream){
            const chunkText=chunk.text()
            fullResponse+=chunkText
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`)
        }
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        res.end()
        return;
    }


    conversation.messages.push({
        role:"model",
        text:fullResponse
    })
    await conversation.save()
    res.write(`data: ${JSON.stringify({ done: true, conversationId: conversation._id })}\n\n`)
    res.end()
})

const getConversations= asyncHandler(async(req,res)=>{
    const conversations=await Conversation.find({
        owner:req.user._id
    })
    .select("-messages")
    .sort({updatedAt:-1})

    return res.status(200).json(new ApiResponse(200,conversations,"Conversations fetched successfully!!!"))
})
const getConversationById= asyncHandler(async(req,res)=>{
    const {conversationId}=req.params
    if(!isValidObjectId(conversationId)){
        throw new ApiError(400,"Invalid Conversation ID!!1")
    }
    const conversation=await Conversation.findOne({
        _id:conversationId,
        owner:req.user._id
    })
    if (!conversation){
        throw new ApiError(404,"Conversations not found!!!")
    }
    return res.status(200)
    .json(new ApiResponse(200,conversation,"Conversations Fetched!!!"))
    
})
const deleteConversation=asyncHandler(async(req,res)=>{
    const {conversationId}=req.params
    if(!isValidObjectId(conversationId)){
        throw new ApiError(404,"Conversation ID not found!!!")
    }
    const conversation=await Conversation.findOneAndDelete({
        _id:conversationId,
        owner:req.user._id
    })
    if(!conversation){
        throw new ApiError(404,"Conversations not found!")
    }
    return res
    .status(200).json(new ApiResponse(200,{},"Conversations deleted!!!"))
})
export {
    sendMessage,
    getConversations,
    getConversationById,
    deleteConversation
}