export const getAccessToken = () => {
  if (typeof window === "undefined") {
    return ""
  }

  return localStorage.getItem("access_token")
}
