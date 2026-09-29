import { useNavigate } from "react-router-dom"
import withAuth from "../utils/withAuth"
import { useState } from "react"
import "../App.css"
import IconButton from "@mui/material/IconButton"
import RestoreIcon from "@mui/icons-material/Restore"
import Button from "@mui/material/Button"

function HomeComponent(){

    const [meetingCode, setMeetingCode] = useState("")

    let navigate = useNavigate()
    
    let handleJoinVideoCall = async()=>{
        navigate(`/${meetingCode}`)
    }
    return(
        <>
            <div className="navBar">

                <div style={{display:"flex", alignItems:"center"}}>
                    <h2>Video call</h2>

                </div>

                <div style={{display:"flex", alignItems:"center"}}>
                    <IconButton>
                        <RestoreIcon/>
                    </IconButton >
                    <p> History</p>
                    <Button
                        onClick={()=>{
                            localStorage.removeItem("token")
                            navigate("/auth")
                        }}
                    >
                        Logout
                    </Button>
                </div>

                <div className="meetContainer">
                    <div className="leftPanel">
                        <div>
                            <h2>Providing Quality Video Call Just Like Quality Education</h2>
                            <div style={{display:"flex", gap:"10px "}}></div>
                        </div>

                    </div>
                </div>

            </div>
        </>
    )
}

export default withAuth(HomeComponent)