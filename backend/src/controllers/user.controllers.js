import httpStatus from "http-status"
import {User} from "../models/user.models.js"
import bcrypt, {hash} from "bcrypt"
import crypto from "crypto"

const login = async(req, res)=>{
    const {username, password} = req.body

    if(!username || !password) { 
        return res.status(400).json({message: "Missing username or password"})
    }

    try{
        const user = await User.findOne({username})
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message: "User not found"})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(isMatch){
            let token = crypto.randomBytes(20).toString("hex") 

            user.token = token
            await user.save()
            return res.status(httpStatus.OK).json({token: token, message: "logged in"})
        }
        else{
            return res.status(httpStatus.UNAUTHORIZED).json({'message': "wrong password"})
        }
    } catch(e){
        return res.status(500).json({message: `Something went wrong ${e}`})
    }
}

const register = async(req, res)=>{
    const {name, username, password} = req.body

    if (!name || !username || !password) {
        return res.status(400).json({
            message: "Name, username and password are required"
        })
    }

    try{
        const existingUser = await User.findOne({username})
        if(existingUser){
            return res.status(httpStatus.FOUND).json({message: "User already exists"})  
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword,
        })
        await newUser.save()

        return res.status(httpStatus.CREATED).json({message:"User Registered"})
    } catch(e){
        res.json({message: `Something went wrong${e}`})
    }
}

export {login, register}