In the sixth and final part of this series, we will implement drag and drop, as well as our first GraphQL mutation (as opposed to a query) to update data, rather than just fetching it.

NOTE: if you are following along, I made some small changes to the app since part 5. Specifically, each task only belongs to 1 category, but I had set the relationship like this: `@OneToMany(type => Task, task => task.categories)`. I have since updated it to be `@OneToMany(type => Task, task => task.category)`, which is more semantically accurate. I had to update the relevant query in the flux store, as well as the test mock response. The actual behavior remains the same. I also updated the `create_schema.sql` script slightly. Again, find the final version in the source code on GitHub.

You can find the final source code here.

## Rendering Tasks

We are rendering categories already, but no tasks. We do have those saved in the flux store, though, so let's start by grabbing the correct tasks for each category. I will handle this in `App.vue`:

```html
<template>
  <select-project :projects="projects" v-model="selectedProject" />
  <div class="categories">
    <category
      v-for="category in categories"
      :key="category.id"
      :category="category"
      :tasks="getTasks(category)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
import { store } from './store'
import SelectProject from './SelectProject.vue'
import Category from './Category.vue'
import { Category as ICategory, Task } from './types'

export default defineComponent({
  components: {
    SelectProject,
    Category
  },

  setup() {
    store.fetchProjects()
    const selectedProject = ref<string>()

    const getTasks = (category: ICategory): Task[] => {
      const tasks = computed(() => store.getState().currentProject?.tasks)
      const myTasks: Task[] = []
      for (const [id, task] of Object.entries(tasks.value)) {
        if (task.categoryId === category.id) {
          myTasks.push(task)
        }
      }
      return myTasks
    }

    watch(selectedProject, id => {
      if (!id) {
         return
      }

      store.fetchProject(id)
    })

    return {
      projects: computed(() => store.getState().projects),
      categories: computed(() => store.getState().currentProject?.categories),
      selectedProject,
      getTasks
    }
  }
})
</script>

<style scoped>
.categories {
  margin: 10px 0 0 0;
  display: flex;
}
</style>
```

I had to import the `Category` interface as `ICategory` since I also named my component `Category`. We also need to update `Category.vue` to render the tasks: I will do this by adding another component, `DraggableTask.vue` (which will be draggable in the near future!)

`Category.vue`:

```html
<template>
  <div class="category">
    {{ category.name }}

    <draggable-task
      v-for="task in tasks"
      :key="task.id"
      :task="task"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Category, Task } from "./types";
import DraggableTask from './DraggableTask.vue'

export default defineComponent({
  components: { DraggableTask },
  props: {
    category: {
      type: Object as () => Category
    },
    tasks: {
      type: Array as () => Task[]
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
  min-height: 400px;
  border-radius: 5px;
}
</style>
```

And `DraggableTask.vue`:


```html
<template>
  <div
    class="task"
  >
    {{ task.name }}
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { Category, Task } from "./types";
export default defineComponent({
  props: {
    task: {
      type: Object as () => Task
    }
  }
})
</script>

<style scoped>
.task {
  background: white;
  color: black;
  padding: 5px;
  height: 40px;
  border-radius: 8px;
  margin: 5px 0;
  cursor: move;
}
</style>
```

Finally, our kanban board is starting to take shape:

SS1

## Drag and Drop

Implementing drag and drop is somewhat of a rite of passage for any front-end developer. Of course we could use a library, but in my experience, libraries are either too featureful and complex, or not featureful enough, or hard to modified to your liking. Since we only need a very simple implementation, we will just roll our own. Plus, it's a great way to learn. Once we have drag and drop working, we will add the back-end code to persist the change in category.

First, we need to make the `DraggableTask` draggable, and specify what happens when we start and stop dragging the element:

```html
<template>
  <div
    class="task"
    draggable="true"
    @dragstart="dragstart"
    @dragend="dragend"
    :data-taskid="task.id"
  >
    {{ task.name }}
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { Category, Task } from "./types";
export default defineComponent({
  props: {
    task: {
      type: Object as () => Task
    }
  },
  setup(props) {
    const dragging = ref(false)
    const dragstart = (e) => {
      dragging.value = true
      e.dataTransfer.setData('text/plain', JSON.stringify({
        id: e.target.id,
        taskid: props.task.id
      }))
    }
    const dragend = (e) => {
      dragging.value = false
    }
    return {
      dragstart,
      dragend
    }
  }
})
</script>
```

Once you set an element to `draggable="true"`, it will be draggable in the browser. Because we need some way to track which task is getting dragged and where it is dropped, we set that data with `dataTransfer` as a stringified JSON object.

We are not actually using the `dragging` ref, but you could bind to this (for example with `:class` or `:style`) to visually indicate a task is in the dragging state (for example we could make the other tasks a bit more opace). This would probably be a better UX, however for the purpose of this article we will not be doing this - the goal is just to illustrate how to build the actual kanban board.

The next thing we need to do is specify what happens when  the task is dropped. Update `Category.vue`:

```html
<template>
  <div
    class="category"
    @dragover.prevent
    @drop.prevent="drop"
    data-dropzone="true"
  >
    {{ category.name }}

    <draggable-task
      v-for="task in tasks"
      :key="task.id"
      :task="task"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Category, Task } from "./types";
import DraggableTask from './DraggableTask.vue'
import { store } from './store'
export default defineComponent({
  components: { DraggableTask },
  props: {
    tasks: {
      type: Array as () => Task[]
    },
    category: {
      type: Object as () => Category
    }
  },
  setup(props) {
    const drop = (e) => {
      e.preventDefault()
      const { id, taskid } = JSON.parse(e.dataTransfer.getData('text'))
      const draggableElement = document.querySelector(`[data-taskid="${taskid}"]`)
      const dropzone = e.target
      if (dropzone.getAttribute('data-dropzone')) {
        console.log(taskid, props.category.id)
        dropzone.appendChild(draggableElement)
        e.dataTransfer.clearData()
      }
    }
    return {
      drop
    }
  }
})
</script>
```

You need to specify both `@dragover.prevent` and `@drop.prevent` - see what happens if you don't. We also add an event handler in `@drop.prevent` to handle updating the DOM. We do this in a very manual manner, as opposed to using Vue's virtual DOM to update the DOM. Simple is best! We only want to let the user drop on a category element, so we do a check to ensure the `data-dropdone` attribute is present. Then we grab the DOM element and insert it into the category it was dropped on.

We did it - you can now drag and drop tasks between categories. They won't be persisted though - we need a new resolver, a `TaskResolver`, and a GraphQL mutation to do this.

## Adding a TaskResolver

The `TaskResolver` we are going to make (in `src/graphql/task.resolvers.ts`) is very similar to the `ProjectResolver`, so we won't go into too much detail. The main difference is we are now specifying the payload using an `InputType` decorator. To keep things simple, we will only support updating the `categoryId` for a task.

```ts
import { Resolver, Arg, Mutation, InputType, Field, ID } from 'type-graphql'
import { getRepository } from 'typeorm'
import { Task } from '../entity/Task'

@InputType('UpdateTask')
class UpdateTask {
  @Field(type => ID)
  id: number

  @Field(type => ID)
  categoryId: number
}

@Resolver(of => Task)
export class TaskResolver {

  @Mutation(returns => Task)
  async updatingTask(@Arg('task') updateTask: UpdateTask): Promise<Task> {
    const { id, categoryId } = updateTask
    const repo = getRepository(Task)
    await repo.update({ id }, { categoryId })
    return repo.findOne(id)
  }
}
```

Pretty straight forward. We receive a payload with a `id` (for the task) and a `categoryId` and update the relevant column using `update`. Then we returned the newly updated task.

Don't forget to add this to the root of our GraphQL server:

```ts
import { TaskResolver } from "./task.resolvers"

// ...

(async() => {
  await createConnection()
  const schema = await buildSchema({
    resolvers: [ProjectsResolver, TaskResolver]
  })

  // ...
})()
```

We can now create a function in the store to make the request:

```ts
class Store {
  // ...
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
```

We can see the benefit of saving the `tasks` as a non-nested entity - we can access and update the task just by referencing `tasks[taskId].categoryId`. If we had made `tasks` a nested array on `categories`, we would need to iterate the tasks on the old category, remove it, then add it to the new category. A lot of extra code and not nearly as performant, not to mention more code and more complexity leads to more bugs.

This brings us to the end of this series. We did not write a test for the `TaskResolver`, nor the drag and drop. Writing a `TaskResolver` test is fairly trivial, and a good exercise. While you can test drag and drop with Vue Test Utils or Testing Library, I much prefer to test this kind of thing either with Cypress (so you can visual confirm it "looks" correct - drag and drop really needs to look good, not just "work", to be useful) or even just test it by hand. I may look at some strategies for testing this kind of interaction in a future article if there is interest!

## Conclusion

The final installment in this series looked at:

- Implementing drag and drop.
- Using a GraphQL mutation.
- Further emphasised the importance of choosing a the right data structure - we saw how making `tasks` a key-value map made it trivial to update the category.

As of next week, I will return to the traditional format of self contained articles and screencasts. If you have any suggestions or requests, please let me know.

The final source code for this project can be found here.
