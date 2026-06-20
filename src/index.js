import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {DB_NAME} from "./constants.js";
import app from "./app.js"

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.on("error",()=>{
        console.log("Error",error);
        throw error;        
    })
    app.listen(process.env.PORT||8000,()=>{
        console.log(`SERVER CURRENTLY RUNS AT port:${process.env.PORT}`);        
    })
}).catch((err)=>{console.log("MONGO DB connection failed :-( ",err);
})