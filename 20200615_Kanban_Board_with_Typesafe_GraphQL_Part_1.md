Over the next few articles, I will be building a Kanban board app using GraphQL, Vue.js 3, postgres, Vite and some other technologies.

Each article will focus on a different technology and some related concepts. The final product will look something like this:

![](https://raw.githubusercontent.com/lmiller1990/graphql-rest-vue/develop/SS1.png)

The first article or two will focus on the how we present the data: REST vs GraphQL, and how this decision will impact our design. You can find the [source code here](https://github.com/lmiller1990/graphql-rest-vue).

To really understand GraphQL and the problem it solves, you need to see the REST alternative, and its strengths and weaknesses. Furthermore, to get a good TypeScript experience with GraphQL, you need to use a good ORM. I recommend [TypeORM](https://typeorm.io/). We will first implement the Kanban board using REST, and then using GraphQL. This will let us compare and constrast the two.

We will keep things modular and isolate our core logic, namely the construction of the SQL queries, so much of the logic can be shared between the REST and GraphQL servers. We will also learn about TypeORM along the way.

## The Database Schema

The above mock-up has several "entities":

- projects
- categories (the columns)
- tasks

Projects have zero or more categories - a one to many relationship. Tasks, on the other hand, have one category - a one to one relationship. The database could look something like this (and this is the database schema I will use for the series):

```sql
create table projects (
  id serial primary key,
  name text not null
);

create table categories (
  id serial primary key,
  name text not null,
  project_id integer not null,
  foreign key (project_id) references projects(id) on delete cascade
);

create table tasks (
  id serial primary key,
  name text not null,
  project_id integer not null,
  category_id integer not null,
  foreign key (project_id) references projects(id) on delete cascade,
  foreign key (category_id) references categories(id) on delete cascade
);
```

## As a REST API

A very generic REST API might have several endpoints with the following responses. Note, we could add nested `categories` and `tasks` to the `/projects` endpoint, however this would not be very generic - let's imagine the API is provided by a third party project management service, and we are building a kanban board on top of their APIs.

The projects endpoint, `/projects`, might be something like this

```json
[
  {
    "id": 1,
    "name": "Test Project"
  }
]
```

You could get the categories on a project by project basis from `/projects/1/categories`:

```json
[
  {
    "id": 1,
    "name": "ready to develop"
  }
]
```

And finally, the tasks at `/projects/1/tasks`:

```json
[
  {
    "id": 1,
    "name": "Test Project",
    "category_id": 1
  }
]
```

The third part has kindly given us the `category_id` in the tasks response, rather than making us query `/projects/1/categories/2/tasks` etc. I rarely design REST APIs that go more than 2 or 3 resources deep, since it's far too tedious and rarely makes sense.

To get the full dataset for our app, we need 3 requests.

- `/projects` to get a list of projects for the dropdown.
- `/projects/1/categories` to get the categories.
- `/projects/1/tasks` to get the tasks.

While three requests might not be idea, REST APIs are designed like this so developers can build whatever application they like - it's not specifically designed the minimize requests, but to be generically applicable to most use cases.

For now, let's implement the above REST API using TypeORM.

## Setup

Install the dependencies: `yarn add typeorm reflect-metadata @types/node pg`. Next, create a new typeorm project: `typeorm init --database pg`. Finally, create a new database with the following - I am calling my database `kanban`.

```sql
create table projects (
  id serial primary key,
  name text not null
);

create table categories (
  id serial primary key,
  name text not null,
  project_id integer not null,
  foreign key (project_id) references projects(id) on delete cascade
);

create table tasks (
  id serial primary key,
  name text not null,
  project_id integer not null,
  category_id integer not null,
  foreign key (project_id) references projects(id) on delete cascade,
  foreign key (category_id) references categories(id) on delete cascade
);
```

## TypeORM Crash Course

Running the `typeorm init` created a `src/entity` directory. Let's create an entity for the `projects` table in `src/entity/projects.ts`:

```ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string
}
```

The code is most self-explanatory. TypeORM uses a decorator-based API. This works well with GraphQL, which we will see later on. Now that we have a valid entity, update `ormconfig.json`, which was created when we ran `typeorm init`, and let's write our first TypeORM test.

## Testing the Project Entity

This test alone won't be super valuable, but it will help us setup the plumbing for future tests. Since we want to keep our core logic modular and testable, we will be exposing data via controllers that are thin layers on top of **view models**. The view models will encapsulate any complexity behind the REST API, such as pagination, query params and optimizing the SQL. When we implement the GraphQL API, optimizing the SQL queries will be very important, since the N+1 problem becomes an issue very quickly when implementing GraphQL servers.

Create `src/viewModels/projects.ts` and `src/viewModels/__tests__/projects.spec.ts`, and in the test file, add the following:

```ts
import { createConnection, Connection } from 'typeorm'

import { projectViewModel } from '../projects'
import { createProject } from '../../../test/factories/projects'

let connection: Connection

beforeAll(async () => {
  connection = await createConnection()
  const repo = getRepository(Project)
  await repo.remove(await repo.find())
})

afterAll(async () => {
  connection.close()
})

test('projectViewModel', async () => {
  const project = await createProject({ name: 'Test' })
  const vm = await projectViewModel()

  expect(vm).toEqual([
    {
      id: project.id,
      name: 'Test'
    }
  ])
})
```

Before we write the missing code to make this test pass, let's look at each part.

- you need to call `createConnection` before interacting with your database via TypeORM, so we do this in the `beforeAll` hook (and close the connection in `afterAll`).
- we will create some **factories** to make writing tests easy - this is what `createProject` is, and why it's imported from `tests/factories`. This will let use quickly create test data.
- we delete all the projects before each test to ensure a fresh database is used

## Creating a Project factory

There are many ways to handle factory data (also known as *fixtures*, sometimes). I like to keep things simple. the `createProject` function takes a `DeepPartial<Project>`, so we can easily specify project fields when creating the test data to fit the test we are writing.

```ts
import { getRepository, DeepPartial } from 'typeorm'
import { Project } from '../../src/entity/Project'

export const createProject = async (attrs: DeepPartial<Project> = {}): Promise<Project> => {
  return getRepository(Project).save({
    name: attrs.name || 'Test project'
  })
}
```

## Implementing the Projects View Model

Now we can write the core business logic that will present the projects when the REST endpoint is called. Again, we are starting simple:

```ts
import { getRepository } from 'typeorm'

import { Project } from '../entity/Project'

export const projectViewModel = async (): Promise<Project[]> => {
  return getRepository(Project)
    .createQueryBuilder('projects')
    .getMany()
}
```

We could just have done `getRepository(Project).find()` - but this will not work when we need to do some joins.

This is enough to get the test to pass when we run it when `yarn jest`.

Implementing the `tasks` and `categories` view models and, so I will leave that as an exercise. You can find the full implementation in the [source code](https://github.com/lmiller1990/graphql-rest-vue).
.

The next article will explore how to implement relationships in TypeORM, for example `project.categories` and `category.tasks`, and add a HTTP endpoint with Express to expose our data. Then we will move on to GraphQL and the Vue.js front-end.

## Conclusion

This post covered:

- TypeORM
- implementing the ViewModel architecture
- separating core logic via a view model layer to make it testable
- creating factories to support tests
