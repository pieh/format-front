import auth0js from "auth0-js"

import { getAccessToken } from "./accessToken"
import { client as apolloClient } from "./apolloClient"
import gql from "graphql-tag"

export const isBrowser = typeof window !== "undefined"

// To speed things up, we’ll keep the profile stored unless the user logs out.
// This prevents a flicker while the HTTP round-trip completes.
let profile = false

// Only instantiate Auth0 if we’re in the browser.
const auth0 = isBrowser
  ? new auth0js.WebAuth({
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENTID,
      redirectUri: process.env.AUTH0_CALLBACK,
      audience: process.env.AUTH0_AUDIENCE,
      responseType: "token id_token",
      scope: "openid profile email",
    })
  : {}

export const login = () => {
  if (!isBrowser) {
    return
  }

  auth0.authorize()
}

export const logout = callback => {
  if (isBrowser) {
    localStorage.removeItem("access_token")
    localStorage.removeItem("id_token")
    localStorage.removeItem("expires_at")
  }

  // Remove the locally cached profile to avoid confusing errors.
  profile = false
  emitProfile(profile)

  if (callback && typeof callback === `function`) {
    callback()
  }
}

const setSession = authResult => {
  if (!isBrowser) {
    return
  }

  const expiresAt = JSON.stringify(
    authResult.expiresIn * 1000 + new Date().getTime()
  )

  localStorage.setItem("access_token", authResult.accessToken)
  localStorage.setItem("id_token", authResult.idToken)
  localStorage.setItem("expires_at", expiresAt)

  return true
}

export const handleAuthentication = callback => {
  if (!isBrowser) {
    return
  }

  auth0.parseHash((err, authResult) => {
    console.log("parsing hash", authResult)
    if (authResult && authResult.accessToken && authResult.idToken) {
      setSession(authResult)
      callback()
    } else if (err) {
      console.error(err)
    }
  })
}

export const isAuthenticated = () => {
  if (!isBrowser) {
    // For SSR, we’re never authenticated.
    return false
  }

  let expiresAt = JSON.parse(localStorage.getItem("expires_at"))
  return new Date().getTime() < expiresAt
}

export const getUserInfo = () => {
  return new Promise((resolve, reject) => {
    console.log("getting user info")
    // If the user has already logged in, don’t bother fetching again.
    if (profile) {
      emitProfile(profile)
      resolve(profile)
      return
    }

    const accessToken = getAccessToken()
    console.log("access token", accessToken)

    if (!isAuthenticated()) {
      emitProfile(false)
      resolve({})
      return
    }

    console.log("aaaa")
    auth0.client.userInfo(accessToken, (err, userProfile) => {
      console.log("bbbb", userProfile)
      if (err) {
        emitProfile(false)
        reject(err)
        return
      }

      profile = userProfile
      emitProfile(profile)
      resolve(profile)

      apolloClient
        .query({
          query: gql`
            {
              permissions {
                canFormat
              }
            }
          `,
        })
        .then(results => {
          console.log("permissions", results.data)
          if (!results.errors) {
            profile = { ...profile, ...results.data.permissions }
            emitProfile(profile)
          }
        })
    })
  })
}

const emitProfile = profile => {
  window.dispatchEvent(
    new CustomEvent("auth", {
      detail: profile,
    })
  )
  return profile
}
