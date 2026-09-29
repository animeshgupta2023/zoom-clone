import { useContext, useEffect, useState } from "react";
import {AuthContext} from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import { Snackbar } from "@mui/material";
import Typography from '@mui/material/Typography'
import IconButton from "@mui/material/IconButton"
import HomeIcon from '@mui/icons-material/Home'

export default function History(){
    const {getHistoryOfUser} = useContext(AuthContext)
    const [meetings, setMeetings] = useState([])
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState("")

    const routeTo = useNavigate()

    useEffect(()=>{
        const fetchHistory = async()=>{
            try{
                const history = await getHistoryOfUser()
                setMeetings(history)

            } catch(err){
                setMessage(err.response?.data?.message || err.message || "Could not load meeting history.")
                setOpen(true)
            }
        }
        fetchHistory()
    })

    let formatDate = (dateString)=>{
        const date = new Date(dateString)
        const day = date.getDate().toString().padStart(2, "0")
        const month = (date.getMonth()+1).toString().padStart(2, "0")
        const year = date.getFullYear()

        return `${day}/${month}/${year}`
    }

    return (
        <div>
            <IconButton onClick={
                ()=>{
                    routeTo("/home")
                }
            }>
                <HomeIcon/>
            </IconButton >
            {   (meetings.length !== 0) ?
                meetings.map((e, i)=>{
                    return(
                        <>
                            <Card key={i} variant="outlined">
                                <CardContent>
                                    <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                                        Code: {e.meetingCode}
                                    </Typography>
                                    
                                    <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                                        Date: {formatDate(e.date)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </>
                    )
                }): <></>
            }


            <Snackbar
                open={open}
                autoHideDuration={4000}
                message={message}
            />
        </div>
    )
}