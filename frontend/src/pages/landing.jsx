import {Link} from "react-router-dom"

export default function LandingPage(){
    return (

        <div className="landingPageContainer">
            <nav>
                <div className="navHeader">
                    <h2>Video call</h2>
                </div>
                <div className="navlist">
                    <p>Join as Guest</p>
                    <p>Register</p>
                    <div role="button">
                        <p>Login</p>
                    </div>
                </div>
            </nav>


            <div className="landingMainContainer">
                <div>
                    <h1><span style={{color:"#FF9839"}}>Connect</span> with your loved Ones</h1>
                    <p>Cover a distance by video call</p>
                    <div role="button">
                        <Link to={"/auth"}><p>Get Started</p></Link> 
                    </div>
                </div>

                <div>
                    <img src="mobile.png" alt="" />
                </div>
            </div>
        </div>

    )
}