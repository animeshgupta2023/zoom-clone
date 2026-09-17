import dotenv from "dotenv"
dotenv.config()

import express from "express"
import {createServer} from "node:http"
import {Server} from "socket.io"
import mongoose from "mongoose"
import cors from "cors"
import {connectToSocket} from "./controllers/socketManager.js"

const app = express()
const server = createServer(app)
const io = connectToSocket(server)

const URI = process.env.MONGO_URL

app.set("port", (process.env.PORT || 8080))
app.use(cors())
app.use(express.json({limit: "40kb"}))
app.use(express.urlencoded({limit: "40kb", extended: true}))

app.get("/home", (req, res)=>{
    return res.json({"hello": "world"})
})

app.listen(8080, ()=>{
    console.log("listening at port 8080")
    connectDB()
})

const connectDB = async ()=>{
    try{
        await mongoose.connect(URI)
        console.log("Connected with database")
    } catch(err){
        console.log("Failed to connect with Db", err)
    }
}