import { reactive, inject, provide } from 'vue'
import { SelectProject, CurrentProject, FetchProject } from './types'

interface State {
  projects: SelectProject[]
  currentProject?: CurrentProject
}

function initialState(): State {
  return {
    projects: []
  }
}

class Store {
  protected state: State

  constructor(init: State = initialState()) {
    this.state = reactive(init)
  }

  getState(): State {
    return this.state
  }

  async fetchProject(id: string) {
    const response = await window.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
        {
          project(id: ${id}) {
            id
            name
            categories {
              id
              name
            }
            tasks {
              id
              name
              category {
                id
              }
            }
          }
        }
        `
      })
    })
    const result: { data: { project: FetchProject } } = await response.json()
    this.state.currentProject = {
      id: result.data.project.id,
      name: result.data.project.name,
      categories: result.data.project.categories,
      tasks: result.data.project.tasks.reduce((acc, task) => {
        return {
          ...acc,
          [task.id]: {
            id: task.id,
            name: task.name,
            categoryId: task.category.id
          }
        }
      }, {})
    }
    console.log(this.state.currentProject)
  }

  async fetchProjects() {
    const response = await window.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
        {
          projects {
            id
            name
          }
        }`
      })
    })
    const result: { data: { projects: SelectProject[] } } = await response.json()
    this.state.projects = result.data.projects
  }

  async updateTask(taskId: string, categoryId: string) {
    const response = await window.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
        mutation {
          updatingTask(task: {id: ${taskId}, categoryId: ${categoryId}}) {
            category {
              id
            }
          }
        }
        `
      })
    })
    const result: { data: { updatingTask: { category: { id: string } } } } = await response.json()
    store.getState().currentProject.tasks[taskId].categoryId = result.data.updatingTask.category.id
  }
}

export const store = new Store()
