import React from "react"
import PrList from "../components/pr-list"

export default () => {
  if (PrList) {
    return <PrList />
  }

  return <React.Fragment />
}
