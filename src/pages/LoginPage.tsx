import Login from "../components/Login/Login"
import TutorialPopup from "../components/judge/TutorialPopup"


const LoginPage = () => {
  return (
    <div>
        {/* The welcome video: opens as soon as the link is opened, before signing in */}
        <TutorialPopup placement="login" />
        <Login />
    </div>
  )
}

export default LoginPage