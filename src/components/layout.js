import React, { useContext } from "react"
import { ApolloProvider } from "react-apollo"

import {
  Container,
  Button,
  Navbar,
  NavbarMenu,
  NavbarStart,
  NavbarEnd,
  NavbarItem,
} from "bloomer"

import UserContext, {
  Provider as UserContextProvider,
} from "../context/UserContext"
import { login, logout } from "../utils/auth"
import { client as apolloClient } from "../utils/apolloClient"
import { Provider as JobContextProvider } from "../context/JobContext"

const UI = ({ children }) => {
  const { profile, inited: profileInited } = useContext(UserContext)

  return (
    <Container>
      <Navbar>
        <NavbarMenu>
          <NavbarStart />
          <NavbarEnd>
            {profileInited ? (
              profile ? (
                <>
                  <NavbarItem>Hi {profile.nickname}!</NavbarItem>
                  <NavbarItem>
                    <Button isColor="primary" onClick={logout}>
                      Logout
                    </Button>
                  </NavbarItem>
                </>
              ) : (
                <NavbarItem>
                  <Button isColor="primary" onClick={login}>
                    Login
                  </Button>
                </NavbarItem>
              )
            ) : (
              <NavbarItem>
                <Button isLoading>Loading auth</Button>
              </NavbarItem>
            )}
          </NavbarEnd>
        </NavbarMenu>
      </Navbar>
      {children}
    </Container>
  )
}

export default ({ children }) => {
  if (typeof window === `undefined`) {
    return <React.Fragment />
  }

  return (
    <>
      <UserContextProvider>
        <ApolloProvider client={apolloClient}>
          <JobContextProvider>
            <UI>{children}</UI>
          </JobContextProvider>
        </ApolloProvider>
      </UserContextProvider>
    </>
  )
}
