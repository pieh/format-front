import React from "react"
import { navigate } from "gatsby"
import { handleAuthentication, getUserInfo } from "../utils/auth"

export default () => {
  console.log(`callbacking`)
  handleAuthentication(() => getUserInfo().then(() => navigate("/")))

  return <div>Logging you in...</div>
}
