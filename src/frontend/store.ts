import { reactive, inject, provide } from 'vue'
import { SelectProject } from './types'

interface Task {
  id: string
  name: string
  categoryId: string // category.id
}

interface Category {
  id: string
  name: string
}

interface CurrentProject {
  id: string
  name: string
  categories: Category[]
  tasks: Record<string, Task>
}

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
    interface FetchProject {
      project: {
        id: string
        name: string
        categories: Array<{
          id: string
          name: string
        }>
        tasks: Array<{
          id: string
          name: string
        }>
      }
    }

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
            }
          }
        }`
      })
    })
    const result: { data: FetchProject } = await response.json()
    console.log(result.data)
    this.state.currentProject = {
      id: result.data.project.id,
      name: result.data.project.name,
      categories: result.data.project.categories.map(x => ({ id: x.id, name: x.name })),
      tasks: result.data.project.tasks.reduce((acc, curr) => acc[curr.id] = curr, {})
    }
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
}

export const store = new Store()

export const provideStore = (app) => {
  app.provide('store', store)
}

export const useStore = (): Store => {
  const store = inject<Store>('store')
  return store
}
