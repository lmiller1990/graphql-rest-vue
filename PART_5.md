In this article, we continue building our the front-end of kanban board. We previously added the ability to select a project; now we need to fetch the relevant categories and tasks, store the data somewhere in our store, and render a column for each category!

The first thing we need to do is update our `<SelectProject>` component to use `v-model`, so we know when a project was selected. Vue.js 3 changes how `v-model` works slightly, but the idea is the same. The main different is the value is received is a `modelValue` prop, instead of `value` and you need to emit a `update:modelValue` event, instead of an `input` event.

```html
<template>
  <select data-testid="select-project" :value="modelValue" @change="change">
    <option :value="null">Select project</option>
    <option v-for="project in projects" :key="project.id" :value="project.id">
      {{ project.name }}
    </option>
  </select>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { SelectProject } from './types'

export default defineComponent({
  props: {
    modelValue: {
      type: String
    },
    projects: {
      type: Array as () => SelectProject[]
    }
  },
  setup(props, ctx) {
    const change = (e) => {
      if (e.target.value) {
        ctx.emit('update:modelValue', e.target.value)
      }
    }
    return {
      change
    }
  }
})
</script>
```

The changes I've made are highlighted. Now we can use the component with `v-model` in `App.vue`. I will also use `watch` to fetch the relevant project data whenever the selected project changes (we will implement the `fetchProject` function next):

```html
<template>
  <select-project :projects="projects" v-model="selected" />
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
import { store } from './store'
import SelectProject from './SelectProject.vue'

export default defineComponent({
  components: {
    SelectProject
  },

  setup() {
    store.fetchProjects()
    const selected = ref()
    watch(selected, val => {
      store.fetchProject(val)
    })

    return {
      projects: computed(() => store.getState().projects),
      selected
    }
  }
})
</script>
```

## Fetching the Project Data

Now we need to fetch the categories and tasks. We have already got an endpoint for that, so we just need to decide how we will store the data. If this project was going to grow much larger, I would probably create a separate for for `tasks`. Some kanban boards, like Jira, allow you to move tasks between projects, so nesting the tasks under a project might not be ideal. I'd also consider organizing my flux store with something like [flux-entities](https://github.com/lmiller1990/flux-entities). For this series, however, we will keep things simple and as such just nest the categories and tasks under a single `currentProject` field in the store. This will give us some duplication: we will have the current project `id` and `name` in both `projects` and `currentProjects`, however I think it is acceptable for a small application such as this one.

Define some new types in `types.ts`:

```ts
interface Task {
  id: string
  name: string
  categoryId: string
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
```

Notice `categories` is an array and `tasks` is an object. I see the need to access a single task frequently, such as when we implement drag and drop, or perhaps we want to show a modal when a task is clicked: this these cases, I don't want to loop over and array to find my task, which is an `O(n)` operation (not that it matters in this tiny app), as opposed to an `O(1)` operation, which we get using an object. Basically, I see myself doing `tasksMap[id]` more often than I see myself looping over all the tasks, so a key value map (using an object) makes sense here.

I could use a similar approach for `categories` as well; that said, I think an array will be more simple here, so I am going with that. I would likely use key value map (the `Record` type in TypeScript) if I saw the app growing more complex, for the same reason; I think I'll be looking up a single category more often than looping over them all.

I also added a `FetchProject` interface. This will be the shape of the response from the graphql endpoint.

We can now implement `fetchProject`:

```ts
interface State {
  projects: SelectProject[]
  currentProject?: CurrentProject
}

// ...

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
          }
        }
      }`
    })
  })
  const result: { data: FetchProject } = await response.json()
  this.state.currentProject = {
    id: result.data.project.id,
    name: result.data.project.name,
    categories: result.data.project.categories.map(x => ({ id: x.id, name: x.name })),
    tasks: result.data.project.tasks.reduce((acc, curr) => acc[curr.id] = curr, {})
  }
}
```

I updated `State` to have an optional `currentProject` field. If it is `undefined`, we assume the project has not been fetched yet. `fetchProject` is very similar to the `fetchProjects` function from the previous article; there is a lot of duplication here, which could easily be refactored away. This would be a good exercise. We do some simple manipulating of the response to make it fit the `CurrentProject` interface.

Now to render the categories! Add a `Category.vue` component:

```html
<template>
  <div class="category">
    <h4>{{ category.name }}</h4>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { Category } from './types'

export default defineComponent({
  props: {
    category: {
      type: Object as () => Category
    }
  }
})
</script>

<style scoped>
.category {
  background: silver;
  width: 150px;
  margin: 2px;
  padding: 5px;
  border-radius: 5px;
}
</style>
```

Nothing much to see here. This is a UI component; it's output is entirely based on its inputs (the `props` in this case) so it will be very easy to test. Update `App.vue` to use the `Category.vue` component:

```html
<template>
  <select-project :projects="projects" v-model="selected" />
  <div class="categories">
    <category v-for="category in categories" :key="category.id" :category="category" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
import { store } from './store'
import SelectProject from './SelectProject.vue'
import Category from './Category.vue'

export default defineComponent({
  components: {
    SelectProject,
    Category
  },

  setup() {
    store.fetchProjects()
    const selected = ref()
    watch(selected, val => {
      store.fetchProject(val)
    })

    return {
      projects: computed(() => store.getState().projects),
      selected,
      categories: computed(() => store.getState().currentProject && store.getState().currentProject.categories),
    }
  }
})
</script>

<style scoped>
.categories {
  display: flex;
}
</style>
```

And that's enough to get our columns rendering, with the title of the category in each one! The last thing we need to do is render the tasks, which is easy, and implement drag and drop. Drag and drop is also relatively straight-forward. That will be the focus on the next article! We are in the home stretch.

The app is getting fairly complex now, so it's a good time to add a test. There is a fair bit going on here. The important parts are:

- Jest and jsdom do not have `window.fetch`: we are able to mock it by adding `fetch` to the `global` object
- We can use a `mockResponse` variable and change it during the test to simulate different responses from the graphql endpoint
- Both of our data fetching functions `fetchProject` and `fetchProjects` are marked as `async`; we need to use `flush-promises` to force those promises to resolve before the test continues
- `flush-promises` is now exported from Vue Test Utils as of `2.0.0-beta.0`! Convinient.

I go into more depth regarding this test in the accompanying screencast. Check it out!

```ts
import { mount, flushPromises } from '@vue/test-utils'
import App from '../App.vue'

const projectsResponse = {
  projects: [{
    id: '1',
    name: 'Project 1',
  }]
}

const projectResponse = {
  project: {
    id: '1',
    name: 'Project',
    categories: [
      { id: '1', name: 'Category 1' }
    ],
    tasks: []
  }
}

let mockResponse

describe('App', () => {
  beforeAll(() => {
    global['fetch'] = (url: string) => ({
      json: () => ({
        data: mockResponse
      })
    })
  })

  afterAll(() => {
    delete global['fetch']
  })

  it('renders categories', async () => {
    mockResponse = projectsResponse
    const wrapper = mount(App)
    await flushPromises()

    mockResponse = projectResponse
    await wrapper.find('[data-testid="select-project"]').setValue('1')
    await flushPromises()

    expect(wrapper.html()).toContain('Category 1')
  })
})
```

We could write some more tests for `Category` and `SelectProject`: I would do this if they got more complex. For now, I am happy to test everything in a single test, which gives me more coverage and is closer to what a user will be experiencing when they use the application. There are not really any edge cases for `SelectProject` or `Category`, since they are so simple, so I am confident to test the as part of the system in `App.vue`, as opposed to in isolation. The purpose of tests isn't to test everything edge case, and every component in isolation, but to be confident in your application.

You could actually use the real graphql server in this test, if you liked: you would need to figure out a way to use `setValue` without knowing hardcoding the project (you could just create it in `beforeAll` using the `createProject` function we defined for our back-end tests, and grab it from there, though). This might be a good exercise.
## Conclusion

This article focused on rendering the columns for the kanban board. We covered

- new `modelValue` and `update:modelValue` syntax to use `v-model` with a component
- defined some additional types, forcing us to consider the data structures for our store
