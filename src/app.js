import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


import chatRouter from "./routes/chat.routes.js"
import authRouter from "./routes/auth.routes.js"

const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}
))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes-declaration
app.use("/api/v1/chat",chatRouter)
app.use("/api/v1/auth",authRouter)

export default app;