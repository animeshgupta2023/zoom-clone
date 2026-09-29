import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react"
import styles from "../styles/videoComponent.module.css"
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { io } from "socket.io-client";
import IconButton from "@mui/material/IconButton"; 
import VideocamIcon from '@mui/icons-material/Videocam';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import Badge from "@mui/material/Badge";
import ChatIcon from '@mui/icons-material/Chat'


const server_url = "http://localhost:8080"
var connections = {}

const peerConfigConnections = {
    "iceServers": [
        {"urls": "stun:stun.l.google.com:19302"}
    ]
}

export default function VideoMeetComponent(){
    var socketRef = useRef()
    let socketIdRef = useRef("")
    const videoRef = useRef([])
    let localVideoRef = useRef()

    let [videoAvailable, setvideoAvailable] = useState(false)
    let [audioAvailable, setAudioAvailable] = useState(false)
    let [screenAvailable, setscreenAvailable] = useState(false)

    let [video, setVideo] = useState(false) 
    let [videos, setVideos] = useState([]) 
    let [audio, setAudio] = useState(false)
    let [screen, setScreen] = useState()
    
    let [showModal, setShowModal] = useState(true)
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("")
    let [newMessages, setNewMessages] = useState(3)
    let [askForUsername, setAskForUsername] = useState(true) 
    let [username, setUsername] = useState("")

    const getPermissions = async()=>{
        let videoOK = false
        let audioOK = false
        
        try{
            const videoPermission = await navigator.mediaDevices.getUserMedia({video: true})
            videoOK = videoPermission.getVideoTracks().length > 0
            videoPermission.getTracks().forEach(t => t.stop())
            setvideoAvailable(videoOK)

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true})
            audioOK = audioPermission.getAudioTracks().length > 0
            audioPermission.getTracks().forEach(t => t.stop())
            setAudioAvailable(audioOK)

            // !! converts the function reference to a strict true/false boolean
            setscreenAvailable(!!navigator.mediaDevices.getDisplayMedia) 

            if(videoOK || audioOK){
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoOK, audio: audioOK})
                window.localStream = userMediaStream

                if(localVideoRef.current){
                    localVideoRef.current.srcObject = userMediaStream
                    await localVideoRef.current.play().catch(() => {})
                }
            }
        } catch(err){
            console.log(err)
        }
    }

    

    let getUserMediaSuccess = (stream)=>{
        try{
             window.localStream.getTracks().forEach(track => track.stop())
        } catch(e){console.log(e)}

        window.localStream = stream
        localVideoRef.current.srcObject = stream

        for(let id in connections){
            if(id === socketIdRef.current) continue

            stream.getTracks().forEach(track => {
                connections[id].addTrack(track, stream)
            })

            connections[id].createOffer().then((description)=>{
                connections[id].setLocalDescription(description)
                .then(()=>{
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                })
                .catch((e)=>console.log(e)) 
            })
        }

        stream.getTracks().forEach(track => track.onended = ()=>{
            setVideo(false)
            setAudio(false)

            try{
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch(e){console.log(e)}

            let blackSilence = (... args) => new MediaStream([black(... args), silence()]) 
            window.localStream = blackSilence()
            localVideoRef.current.srcObject = window.localStream  

            for(let id in connections){
                // FIX 1: Removed addStream, using addTrack
                window.localStream.getTracks().forEach(track => {
                    connections[id].addTrack(track, window.localStream);
                });
                
                connections[id].createOffer().then((description)=>{
                    connections[id].setLocalDescription(description)
                    .then(()=>{
                        socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                    })
                    .catch(e => console.log(e))
                })
            }
        })
    }

    let silence = ()=>{
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false})
    }

    let black = ({width = 640, height = 480}={})=>{
        let canvas = Object.assign(document.createElement("canvas"), {width, height})
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], {enabled: false})
    }

    let getUserMedia = ()=>{
        if((video && videoAvailable) || (audio && audioAvailable)){
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
            .then(getUserMediaSuccess)
            .then((stream)=>{})
            .catch((e)=>console.log(e))
        } else{
            try{
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch(err){}
        }
    }

    useEffect(()=>{
        if(video !== undefined && audio !== undefined){
            getUserMedia()
        }
    }, [audio, video])

    let gotMessageFromServer = (formId, message)=>{
        var signal = JSON.parse(message)

        if(formId !== socketIdRef.current){

            if (!connections[formId]) return;


            if(signal.sdp){
                connections[formId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(()=>{
                    if(signal.sdp.type === "offer"){
                        connections[formId].createAnswer().then((description)=>{
                            connections[formId].setLocalDescription(description).then(()=>{
                                socketRef.current.emit("signal", formId, JSON.stringify({"sdp": connections[formId].localDescription}))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e=>console.log(e))
            }

            if(signal.ice){
                connections[formId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e=>console.log(e))
            }
        }
    }

    let addMessage = (data, sender, socketIdSender)=>{

        setMessages((prevMessages) => [
            ...prevMessages,
            {sender:sender, data: data}
        ])
        if(socketIdSender !== socketIdRef.current){
            setNewMessages((prevMessages) => prevMessages + 1)
        }
    }

    let connectToSocketServer = ()=>{
        if (socketRef.current) return;

        socketRef.current = io.connect(server_url, { secure: false })
        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on("connect", ()=>{
            socketRef.current.emit("join-call", window.location.href)
            socketIdRef.current = socketRef.current.id
            socketRef.current.on("chat-message", addMessage)

            socketRef.current.on("user-left", (id)=>{
                setVideos((prevVideos) => prevVideos.filter((v) => v.socketId !== id))
                if(connections[id]) {
                    connections[id].close()
                    delete connections[id]
                }
            })

            socketRef.current.on("user-joined", (id, clients)=>{
                clients.forEach((socketListId)=>{
                    if(socketListId === socketIdRef.current) return; 

                    if (connections[socketListId]) return;
                    
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    connections[socketListId].onicecandidate = (event)=>{
                        if(event.candidate){
                            socketRef.current.emit("signal", socketListId, JSON.stringify({'ice': event.candidate}))
                        }
                    }

                    connections[socketListId].ontrack = (event)=>{
                        let stream = event.streams[0]; 
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId)

                        if(videoExists){
                            setVideos(prevVideos => {
                                const updatedVideos = prevVideos.map(v =>
                                    v.socketId === socketListId ? {...v, stream: stream} : v
                                ) 
                                videoRef.current = updatedVideos
                                return updatedVideos
                            })
                        } else{
                            let newVideo = {
                                socketId: socketListId,
                                stream: stream,
                                autoPlay: true,
                                playsInline: true
                            }

                            setVideos(prevVideos => {
                                const updatedVideos = [...prevVideos, newVideo]
                                videoRef.current = updatedVideos 
                                return updatedVideos
                            })
                        }
                    }   
                    
                    if(window.localStream !== undefined && window.localStream !== null){
                        window.localStream.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, window.localStream);
                        })
                    } else {
                        let blackSilence = (... args) => new MediaStream([black(... args), silence()]) 
                        window.localStream = blackSilence()
                        
                        window.localStream.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, window.localStream);
                        })
                    }
                })

                if (id === socketIdRef.current) {
                    for (let key in connections) {
                        if (key === socketIdRef.current) continue;
                        
                        connections[key].createOffer().then((description) => {
                            return connections[key].setLocalDescription(description)
                        })
                        .then(() => {
                            socketRef.current.emit("signal", key, JSON.stringify({ "sdp": connections[key].localDescription }))
                        })
                        .catch((err) => console.log(err))
                    }
                }
            })
        })
    }

    let getMedia = ()=>{
        setVideo(videoAvailable)
        setAudio(audioAvailable)
        connectToSocketServer()
    }

    let routeTo = useNavigate()

    let connect = ()=>{
        setAskForUsername(false)
        getMedia()
    }

    let handleVideo = ()=>{
        setVideo(!video)
    }

    let handleAudio = ()=>{
        setAudio(!audio)
    }

    let getDisplayMediaSuccess = (stream)=>{
        try{    
            window.localStream.getTracks().forEach(track=>track.stop())
        } catch(e){
            console.log(e)
        }
        window.localStream = stream
        localVideoRef.current.srcObject = stream

        for(let id in connections){
            if(id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description)=>{
                connections[id].setLocalDescription(description)
                .then(()=>{
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp": connecgtions[id].localDescription}))
                })
                .catch((e)=>console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = ()=>{
            setScreen(false)

            try{
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch(e){console.log(e)}

            let blackSilence = (... args) => new MediaStream([black(... args), silence()]) 
            window.localStream = blackSilence()
            localVideoRef.current.srcObject = window.localStream  

            getUserMedia()
        })

    }

    let getDisplayMedia = ()=>{
        if(screen){
            if(navigator.mediaDevices.getDisplayMedia){
                navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
                .then(getDisplayMediaSuccess)
                .then((stream)=>{})
                .catch((e)=>{console.log(e)})
            }
        }
    }

    useEffect(()=>{
        if(screen !== undefined){
            getDisplayMedia()
        }
    }, [screen])

    let handleScreen = ()=>{
        setScreen(!screen)
    }

    let handleEndCall = ()=>{
        try{
            let tracks = localVideoRef.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch(e){console.log(e)}

        routeTo("/home")
    }

    let sendMessage = ()=>{
        socketRef.current.emit("chat-message", message, username)
        setMessage("")
    }

    useEffect(()=>{
        connections = {}
        getPermissions()
    },[])

    return (
        <div>
            
            {
                askForUsername === true ?
                    <div>
                        <h2>Enter into Lobby</h2>
                        <TextField id="outlined-basic" label="Username" value={username} onChange={e=>setUsername(e.target.value)} variant="outlined" />
                        <Button 
                            variant="contained" 
                            onClick={connect} 
                            onKeyDown={(e)=>{
                                if(e.key === "Enter"){
                                    connect()
                                }
                            }}
                        >
                            Connect
                        </Button>
                        <div>
                            <video ref={localVideoRef} autoPlay muted playsInline></video>
                        </div>
                    </div> : 


                    <div className={styles.meetVideoContainer}>

                        {showModal ? 
                            <div className={styles.chatRoom}>
                                
                                <div className={styles.chatContainer}>
                                    <h1>Chat</h1>

                                    <div className={styles.chattingDisplay}>
                                        {messages.length > 0 ? messages.map((item, index)=>{
                                            return(   
                                                <div key={index} style={{marginBottom:"20px"}}>
                                                    <p style={{fontWeight: "bold"}}>{item.sender}</p>
                                                    <p>{item.data}</p>
                                                </div>
                                            )
                                        }): <>No Messages yet</>}
                                    </div>

                                    <div className={styles.chattingArea}>
                                        
                                        <TextField 
                                            id="outlined-basic" 
                                            label="Enter your message"
                                            value={message} 
                                            onChange={e => setMessage(e.target.value )}
                                            variant="outlined" 
                                            className={styles.TextField}
                                        />
                                        <Button 
                                            variant="contained" 
                                            className={styles.sendButton}
                                            onClick={sendMessage}
                                            onKeyDown={(e)=>{
                                                if(e.key === "Enter"){
                                                    sendMessage()
                                                }
                                            }}
                                        >Send</Button>
                                    </div>
                                </div>

                            </div> :
                            <></>
                        }

                        <div className={styles.buttonContainers}>
                            <IconButton onClick={handleVideo} style={{color: "white"}}>
                                {(video === true) ? <VideocamIcon/>: <VideocamOffIcon/>}
                            </IconButton>

                            <IconButton onClick={handleEndCall} style={{color: "red"}}>
                                <CallEndIcon />
                            </IconButton>

                            <IconButton onClick={handleAudio} style={{color: "white"}}>
                                {(audio === true) ? <MicIcon/>: <MicOffIcon/>}
                            </IconButton>

                            {screenAvailable === true ?
                                <IconButton onClick={handleScreen} style={{color: "white"}}>
                                    {(screen === true) ? <ScreenShareIcon/>: <StopScreenShareIcon/>}
                                </IconButton> : <></>
                            }   

                            <Badge badgeContent={newMessages} max={999} color="secondary">
                                <IconButton onClick={()=>setShowModal(!showModal)} style={{color:"white"}}>
                                    <ChatIcon/>
                                </IconButton>
                            </Badge>


                        </div>


                        <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted playsInline></video>
                        <div className={styles.conferenceView}>
                            {videos.map((video)=>(
                                <div  key={video.socketId}>
                                    <video 
                                        data-socket={video.socketId}
                                        ref={ref=>{
                                            if(ref && video.stream){ 
                                                ref.srcObject = video.stream
                                            }
                                        }}
                                        autoPlay
                                    >
                                    </video>
                                </div>
                            ))}
                        </div>
                    </div>
            }
        </div>
    )
}