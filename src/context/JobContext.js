import React, { useEffect } from "react"

import gql from "graphql-tag"
import { Query } from "react-apollo"

export const TASKS_AND_JOBS = gql`
  {
    tasks {
      taskID
      type
      args {
        pr
      }
    }
    job {
      uuid
      status
      task {
        taskID
        type
        args {
          pr
        }
      }
    }
    finishedJobs {
      uuid
      status
      task {
        taskID
        type
        args {
          pr
        }
      }
    }
  }
`

const JOB_CHANGED_SUBSCRIPTION = gql`
  subscription jobChangeSubscription {
    jobChanged {
      uuid
      status
    }
  }
`

const CURRENT_JOB_SUBSCRIPTION = gql`
  subscription currentJobSubscription {
    currentJob {
      uuid
      status
      task {
        taskID
        type
        args {
          pr
        }
      }
    }
  }
`

const TASK_ADDED_SUBSCRIPTION = gql`
  subscription taskAddedSubscription {
    taskAdded {
      taskID
      type
      args {
        pr
      }
    }
  }
`

const TASK_REMOVED_SUBSCRIPTION = gql`
  subscription taskRemovedSubscription {
    taskRemoved {
      taskID
      type
      args {
        pr
      }
    }
  }
`

const Context = React.createContext()

const ProviderThatWillSubscribe = ({ data, children, subscribeToMore }) => {
  useEffect(() => {
    console.log("subscribing")
    // job update
    subscribeToMore({
      document: JOB_CHANGED_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        const newState = { ...prev }

        if (
          prev.job &&
          prev.job.uuid === subscriptionData.data.jobChanged.uuid
        ) {
          console.log("changing new")
          newState.job = {
            ...prev.job,
            ...subscriptionData.data.jobChanged,
          }
        } else {
          const oldJobIndex = prev.finishedJobs.findIndex(
            job => job.uuid === subscriptionData.data.jobChanged.uuid
          )
          if (oldJobIndex !== -1) {
            console.log("changing old")
            newState.finishedJobs.splice(oldJobIndex, 1, {
              ...prev.finishedJobs[oldJobIndex],
              ...subscriptionData.data.jobChanged,
            })
          }
        }

        // console.log("sub", {
        //   prev,
        //   subscriptionData,
        //   newState,
        // })

        return newState
      },
    })

    // current job change
    subscribeToMore({
      document: CURRENT_JOB_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        const newState = { ...prev }

        if (prev.job) {
          if (
            !subscriptionData.data.currentJob ||
            prev.job.uuid !== subscriptionData.data.currentJob
          ) {
            // new job or job finished
            newState.finishedJobs = [prev.job, ...prev.finishedJobs]
          }
        }

        newState.job = subscriptionData.data.currentJob

        // console.log("sub2", {
        //   prev,
        //   subscriptionData,
        //   newState,
        // })

        return newState
      },
    })

    // task added
    subscribeToMore({
      document: TASK_ADDED_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        console.log("task added", subscriptionData)
        const newState = { ...prev }
        newState.tasks = [...prev.tasks, subscriptionData.data.taskAdded]
        return newState
      },
    })

    // task removed
    subscribeToMore({
      document: TASK_REMOVED_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        const newState = { ...prev }
        newState.tasks = prev.tasks.filter(
          task => task.taskID !== subscriptionData.data.taskRemoved.taskID
        )
        console.log("taskRemoved", subscriptionData, newState)
        return newState
      },
    })
  }, [])

  return <Context.Provider value={data}>{children}</Context.Provider>
}

export const getItemsForPR = (data, pr) => {
  if (!Array.isArray(data.finishedJobs)) {
    return {
      jobs: [],
      isQueued: false,
      isRunning: false,
    }
  }

  let isRunning = false

  // debugger
  let jobs = data.finishedJobs.filter(job => job.task.args.pr === pr)
  if (data.job && data.job.task.args.pr === pr) {
    isRunning = true
    jobs.unshift(data.job)
  }

  const isQueued = data.tasks.some(task => task.args.pr === pr)
  // if (pr == 11361) {
  //   debugger
  // }

  return {
    jobs,
    isQueued,
    isRunning,
  }
}

export const Provider = ({ children }) => {
  return (
    <Query query={TASKS_AND_JOBS}>
      {results => {
        return (
          <ProviderThatWillSubscribe {...results}>
            {children}
          </ProviderThatWillSubscribe>
        )
      }}
    </Query>
  )
}

export default Context
