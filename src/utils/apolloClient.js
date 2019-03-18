import { ApolloClient } from "apollo-client"
import { getAccessToken } from "./accessToken"
import { ApolloLink, split } from "apollo-link"
import { HttpLink } from "apollo-link-http"
import { WebSocketLink } from "apollo-link-ws"
import { getMainDefinition } from "apollo-utilities"
import { InMemoryCache } from "apollo-cache-inmemory"

export const isBrowser = typeof window !== "undefined"

const cache = new InMemoryCache()

let client = null
if (
  process.env.BUILD_STAGE === `develop` ||
  process.env.BUILD_STAGE === `build-javascript`
) {
  console.log(process.env.GRAPHQL_API, process.env.SUBSCRIPTION_API)
  // Create an http link:
  const httpLink = new HttpLink({
    uri: `${process.env.GRAPHQL_API}/graphql`,
  })

  const middlewareLink = new ApolloLink((operation, forward) => {
    operation.setContext({
      headers: {
        authorization: `Bearer ${getAccessToken()}`,
      },
    })
    return forward(operation)
  })

  // const stateLink = withClientState({
  //   cache,
  //   resolvers: {
  //     Mutation: {
  //       format: (_, args, { cache }) => {
  //         console.log("mutation format")
  //         debugger
  //         // const data = {
  //         //   networkStatus: {
  //         //     __typename: "NetworkStatus",
  //         //     isConnected,
  //         //   },
  //         // }
  //         // cache.writeData({ data })
  //         return null
  //       },
  //     },
  //   },
  // })

  // Create a WebSocket link:
  const wsLink = new WebSocketLink({
    uri: `${process.env.SUBSCRIPTION_API}/graphql`,
    options: {
      reconnect: true,
    },
  })

  const link = split(
    // split based on operation type
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query)
      return kind === "OperationDefinition" && operation === "subscription"
    },
    wsLink,
    middlewareLink.concat(httpLink)
  )

  client = new ApolloClient({
    link,
    cache,
  })
}

export { client }
