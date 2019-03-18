import React, { useState, useContext } from "react"
import gql from "graphql-tag"
import { Query, Mutation } from "react-apollo"

import {
  Button,
  Box,
  Media,
  Level,
  LevelLeft,
  LevelRight,
  MediaLeft,
  MediaRight,
  MediaContent,
  LevelItem,
  // Input,
  Tag,
} from "bloomer"

import UserContext from "../context/UserContext"
import JobContext, {
  getItemsForPR,
  TASKS_AND_JOBS,
} from "../context/JobContext"

const GET_PULL_REQUESTS = gql`
  {
    pullRequests {
      number
      title
      lintStatus
      url
    }
  }
`

const FORMAT = gql`
  mutation format($pr: Int!) {
    format(pr: $pr)
  }
`

const statusColorMap = {
  FAILURE: `danger`,
  SUCCESS: `success`,
  PENDING: `info`,
}
const CheckStatus = ({ status }) => {
  return <Tag isColor={statusColorMap[status]}>{status}</Tag>
}

const statusFilters = {
  all: {
    label: "All",
    filter: () => true,
  },
  lintFailed: {
    label: `Linting error`,
    filter: pr => pr.lintStatus === `FAILURE`,
  },
}

const PullRequests = ({ loading, error, data, refetch, filter, setFilter }) => {
  const { profile } = useContext(UserContext)
  const jobData = useContext(JobContext)

  // console.log({ profile, jobData })

  let content = null
  let levelLeft = null

  const prFilter = statusFilters[filter.status].filter

  if (error) {
    content = <Box>Error</Box>
  } else if (data && data.pullRequests) {
    // console.log(data)
    content = data.pullRequests.filter(prFilter).map(pr => {
      const jobForPr = getItemsForPR(jobData, pr.number)
      // console.log("a", pr, jobForPr)
      return (
        <React.Fragment key={pr.number}>
          <Media>
            <MediaLeft>
              <a href={pr.url} target="_blank" rel="noopener noreferrer">
                #{pr.number}
              </a>
            </MediaLeft>
            <MediaContent>
              {pr.title}
              <br />
              <div style={{ marginTop: `0.5em` }}>
                <Level>
                  <LevelLeft>
                    <LevelItem>
                      <small>
                        Lint status: <CheckStatus status={pr.lintStatus} />
                      </small>
                    </LevelItem>
                    {jobForPr.isRunning ? (
                      <LevelItem>
                        <small>
                          Format job:{" "}
                          <Tag isColor="primary">
                            {jobData.job.status.toUpperCase()}
                          </Tag>
                        </small>
                      </LevelItem>
                    ) : jobForPr.isQueued ? (
                      <LevelItem>
                        <small>
                          Format job: <Tag isColor="warning">QUEUED</Tag>
                        </small>
                      </LevelItem>
                    ) : (
                      jobForPr.jobs.length > 0 && (
                        <LevelItem>
                          <small>
                            Format job:{" "}
                            <Tag isColor="warning">
                              {jobForPr.jobs[0].status.toUpperCase()}
                            </Tag>
                          </small>
                        </LevelItem>
                      )
                    )}
                  </LevelLeft>
                </Level>
              </div>
            </MediaContent>
            {profile &&
              profile.canFormat &&
              (pr.lintStatus === "FAILURE" || pr.lintStatus === "NONE") && (
                <MediaRight>
                  {jobForPr.isQueued || jobForPr.isRunning ? (
                    <Button
                      isLoading
                      isColor={jobForPr.isRunning ? `primary` : undefined}
                    >
                      Format
                    </Button>
                  ) : (
                    <Mutation mutation={FORMAT}>
                      {(format, b) => {
                        // console.log("m", f, b)
                        return (
                          <Button
                            onClick={() => {
                              format({
                                variables: { pr: pr.number },
                                optimisticResponse: true,
                                update: (proxy, { data }) => {
                                  const cachedData = proxy.readQuery({
                                    query: TASKS_AND_JOBS,
                                  })
                                  console.log(TASKS_AND_JOBS, cachedData)
                                  cachedData.tasks.push({
                                    __typename: `Task`,
                                    taskID: `format-{"pr":${pr.number}}`,
                                    type: "format",
                                    args: {
                                      pr: pr.number,
                                      __typename: `TaskArgs`,
                                    },
                                  })
                                  proxy.writeQuery({
                                    query: TASKS_AND_JOBS,
                                    data: cachedData,
                                  })
                                },
                              })
                            }}
                          >
                            Format
                          </Button>
                        )
                      }}
                    </Mutation>
                  )}
                </MediaRight>
              )}
          </Media>
        </React.Fragment>
      )
    })
    levelLeft = (
      <>
        {Object.keys(statusFilters).map(k => {
          const current = k === filter.status
          const { label } = statusFilters[k]

          return (
            <LevelItem key={k}>
              {current ? (
                <strong>{label}</strong>
              ) : (
                // eslint-disable-next-line
                <a onClick={() => setFilter({ ...filter, status: k })}>
                  {label}
                </a>
              )}
            </LevelItem>
          )
        })}
      </>
    )
  }

  return (
    <>
      <Level>
        <LevelLeft>{levelLeft}</LevelLeft>
        <LevelRight>
          <Button isLoading={loading} onClick={() => refetch()}>
            Refresh
          </Button>
        </LevelRight>
      </Level>
      {content}
    </>
  )
}

export default () => {
  const [filter, setFilter] = useState({
    status: `lintFailed`,
  })

  return (
    <>
      <Query query={GET_PULL_REQUESTS}>
        {results => {
          return (
            <PullRequests {...results} filter={filter} setFilter={setFilter} />
          )
        }}
      </Query>
    </>
  )
}
