import { model, Schema } from "mongoose";


const meetingSchema = new Schema({
    user_id: {type: String},
    meeting: {type: String, required: true, },
    date: {type: Date, default: Date.now, required: true}
})

const Meeting = new model("Meeting", meetingSchema)

export {Meeting}