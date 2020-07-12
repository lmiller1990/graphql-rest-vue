The first three parts of this series focused on building the back-end - now we move onto the frontend! Note: if you are following along, I extended the `ProjectResolver` a little bit since the previous article, so check out the GitHub repository to get the latest changes.

This article will focus on querying the API from the Vue app, building the select project dropdown, and a reactive store. As a reminder, the goal is a Kanban board like this:

![](https://raw.githubusercontent.com/lmiller1990/graphql-rest-vue/develop/SS1.png)

## Setting up Vite

I will use [Vite](https://github.com/vitejs/vite), as opposed to the vue-cli, to develop the frontend. It's much faster and has TypeScript support out of the box. Install it with `yarn add vite --dev`. Since `vite` is designed for loading ES modules, and for frontend development, some of the existing dependencies will cause problems. Move *all* the existing dependencies to `devDependencies`. For more information on why, see the accompanying screencast.

I created a new file at the root of the project, `index.html` with the following:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kanban</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts">
  </script>
</body>
</html>
```

Note that Vite can load TypeScript out of the box. Great! In `src/frontend/main.ts`, create a new Vue app:

```ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
```

`App.vue` is pretty simple, too:

```html
<template>
  <div>App</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
  }
})
</script>
```

## Loading Data

The next thing is to load all the `projects`. I would normally use `axios` for this, but `axios` does not appear to have an ES build, so it won't work with Vite without some extra work. Instead, I will use `window.fetch`. The next question is how will we store the data? We could use the component local state, since this app is simple, but in my experience as apps grow, you need some kind of store. Let's make a simple one using Vue's new reactivity system.

## A Simple Store

I will make a simple store. It will live in `src/frontend/store.ts`. I have also defined `SelectProject` interface, which will be used in the dropdown to select a project. `src/frontend/types.ts` looks like this:

```ts
export interface SelectProject {
  id: string
  name: string
}
```

The store is like this:

```ts
import { reactive } from 'vue'
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
    // fetch posts...
  }
}

export const store = new Store()
```

The store is powered by Vue's new `reactive` function, which makes an object reactive. We also define the initial state to have a `projects` array, which will store the projects for the dropdown. How categories and tasks will be stored will be discussed later - for now we are just focusing on letting the user select a project.

Another improvement that will come in the future is to use `provide` and `inject` instead of exporting the store instance directly from the store. Stay tuned!

## Adding CORS

During development, we will have two servers: the graphql server and the Vite dev server. To allow cross origin requests, we need to enable CORS. I did this in `src/graphql/index.ts` using the `cors` package:

```ts
// ...
import * as express from 'express'
import * as cors from 'cors'

(async() => {
  // ...

  const app = express()
  app.use(cors())
  // ...

  app.listen(4000)
})()
```

## Making a GraphQL Request with `fetch`

You can use a library like `vue-apollo` to manage your GraphQL requests, but I'd like to keep things simple for this example. We will just use `fetch`. Update the store's `fetchProjects` function

```ts
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
```

Unfortunately `fetch` does not have the nice generic types `axios` does, so we need to type the request manually. No big deal.

## The Select Project Dropdown

Create a new component `<select-project>`:

```html
<template>
  <select>
    <option v-for="project in projects" :key="project.id">
      {{ project.name }}
    </option>
  </select>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { SelectProject } from './types'

export default defineComponent({
  props: {
    projects: {
      type: Array as () => SelectProject[]
    }
  }
})
</script>
```

And use it in `App.vue`:

```html
<template>
  <select-project :projects="projects" />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { store } from './store'
import SelectProject from './SelectProject.vue'

export default defineComponent({
  components: {
    SelectProject
  },

  setup() {
    return {
      projects: computed(() => store.getState().projects)
    }
  }
})
</script>
```

Importing the `store` instance is not ideal - the next article will show how to use dependency injection with `provide` and `inject`.

## Conclusion

Although we just rendered a dropdown, which might not seem like much, we have set ourselves up for success by creating a store which will let our app scale, and are fetching the projects using `fetch` from our GraphQL API. The next step is allowing the user to select a project, which will load the categories and tasks, as well as making our store implementation more robust with `provide` and `inject`.
