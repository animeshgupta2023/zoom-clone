import { useNavigate } from "react-router-dom"
import withAuth from "../utils/withAuth"
import { useContext, useState } from "react"
import "../App.css"
import IconButton from "@mui/material/IconButton"
import RestoreIcon from "@mui/icons-material/Restore"
import Button from "@mui/material/Button"
import { TextField } from "@mui/material"
import { AuthContext } from "../contexts/AuthContext"

function HomeComponent(){

    let navigate = useNavigate()

    const [meetingCode, setMeetingCode] = useState("")
    const {addToUserHistory} = useContext(AuthContext)
    
    let handleJoinVideoCall = async()=>{
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }
    return(
        <>
            <div className="navBar">

                <div style={{display:"flex", alignItems:"center"}}>
                    <h2>Video call</h2>

                </div>

                <div style={{display:"flex", alignItems:"center"}}>
                    <IconButton onClick={
                        ()=>{
                            navigate("/history")
                        }
                    }>
                        <RestoreIcon/>
                        <p> History</p>
                    </IconButton >
                    
                    <Button
                        onClick={()=>{
                            localStorage.removeItem("token")
                            navigate("/auth")
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </div>
            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Providing Quality Video Call Just Like Quality Education</h2>
                        
                        <div style={{display:"flex", gap:"10px "}}></div>

                        <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant="outlined"/>
                        <Button onClick={handleJoinVideoCall} variant="contained">Join</Button>

                    </div>

                </div>
                <div className="rightPanel"> 
                    <img srcSet="/logo3.png" alt="" />
                </div>
            </div>
        </>
    )
}

export default withAuth(HomeComponent)