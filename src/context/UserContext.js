import React, { useState, useEffect } from "react"
import { getUserInfo } from "../utils/auth"

// export const defaultUserContext = {
//   loading: false,
//   error: false,
//   profile: {},
//   handleLogout: () => {},
// }

const Context = React.createContext()

export const Provider = ({ children }) => {
  const [profile, setProfile] = useState({ inited: false, profile: false })

  useEffect(() => {
    const handler = ev => {
      setProfile({
        inited: true,
        profile: ev.detail,
      })
    }

    window.addEventListener("auth", handler)
    getUserInfo()

    return () => {
      window.removeEventListener("auth", handler)
    }
  }, [setProfile])

  return <Context.Provider value={profile}>{children}</Context.Provider>
}

export default Context
