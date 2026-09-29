import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

const withAuth = (WrappedComponent)=>{
    const AuthComponent = (props)=>{
        const router = useNavigate()

        // TODO
        // check the token from teh backend if it is correct or not
        const isAuthenticated = ()=>{
            if(localStorage.getItem("token")){
                return true
            } else {
                return false
            }
        }

        useEffect(()=>{
            if(!isAuthenticated){
                router("/auth")
            } 
        }, [])

        return <WrappedComponent {...props}/>
    }

    return AuthComponent
}

export default withAuth