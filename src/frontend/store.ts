import { reactive, inject, provide } from 'vue'
import { SelectProject } from './types'

interface State {
  projects: SelectProject[]
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
