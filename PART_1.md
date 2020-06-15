Over the next few articles, I will be building a Kanban board app using GraphQL, Vue.js 3, Vite and some other technologies. Each article will focus on a different technology and some related concepts. The final product will look something like this:

SS1

The first article or two will focus on the how we present the data: REST vs GraphQL, and how this decision will impact our design.

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
  project_id integer not null,
  name text not null,
  foreign key (project_id) references projects(id),
);

create table tasks (
  id serial primary key,
  name text not null,
  project_id integer not null,
  category_id integer not null,
  foreign key (project_id) references projects(id),
  foreign key (category_id) references categories(id)
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
  name text not null
);

create table tasks (
  id serial primary key,
  name text not null,
  project_id integer not null,
  category_id integer not null,
  foreign key (project_id) references projects(id),
  foreign key (category_id) references categories(id)
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
  await connection.synchronize(true)
})

afterAll(async () => {
  connection.close()
})

test('projectViewModel', async () => {
  const project = await createProject({ name: 'Test' })
  const category = await createCategory({ name: 'Ready to develop' }, project)
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
- by calling `connection.synchronize(true)`, all the data will be dropped before the test, giving us a clean slate. The `true` argument has this effect (confusingly enough. I wish it was `synchronize({ dropData: true })` or something more descriptive.
- we will create some **factories** to make writing tests easy - this is what `createProject` is, and why it's imported from `tests/factories`. This will let use quickly create test data.

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
    .createQueryBuilder('project')
    .getMany()
}
```

We could just have done `getRepository(Project).find()` - but this will not work when we need to do some joins.

This is enough to get the test to pass when we run it when `yarn jest`.

## Add Categories

Let's see how TypeORM handles relationships by adding categories to the view model. First, update the test:

```ts
import { createCategory } from '../../../test/factories/categories'

// ...

test('projectViewModel', async () => {
  const project = await createProject({ name: 'Test' })
  const category = await createCategory({ name: 'Ready to develop' }, project)
  const vm = await projectViewModel()

  expect(vm).toEqual([
    {
      id: project.id,
      name: 'Test',
      categories: [
        {
          id: category.id,
          name: 'Ready to develop'
        }
      ]
    }
  ])
})
```

And `tests/factories/categories.ts`:

```ts
import { DeepPartial, getRepository } from 'typeorm'

import { Category } from '../../src/entity/Category'
import { Project } from '../../src/entity/Project'

export const createCategory = (
  category: DeepPartial<Category>,
  project: Project
) => {
  return getRepository(Category).save({
    name: category.name,
    project
  })
}
```

## TypeORM Relationships

TypeORM has a really nice API for relationships. We want to express the one project -> many categories relationship, as well as the one category -> one project relationship. In other words, a 1..n (one to many) and a 1..1 (one to one) relationship.

Update `src/entities/Project.ts`:

```ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Category } from './Category'

@Entity({ name: 'projects' })
export class Project {

  // ...

  @OneToMany(type => Category, category => category.project)
  categories: Category
}
```

All we need to do is add the property with the relevant decorators, and we will be able to access the categories with `project.categories`. Create `src/entities/Category.ts` and add the inverse:

```ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'

import { Project } from './Project'

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @ManyToOne(type => Project, project => project.categories)
  project: Project
}
```

Finally, we can update the project view model and the test will pass:

```ts
import { getRepository } from 'typeorm'

import { Project } from '../entity/Project'

export const projectViewModel = async (): Promise<Project[]> => {
  return getRepository(Project)
    .createQueryBuilder('project')
    .innerJoinAndSelect('project.categories', 'categories')
    .getMany()
}
```

## Adding the Controller and HTTP Server

All the hard work is done, and we have 100% test coverage. Now we just need a way to expose it to the outside world. Add express, and in `src/rest` create `projects.ts` and `index.ts`. `projects.ts` will house the endpoint:

```ts
import { Request, Response } from 'express'

import { projectViewModel } from '../viewModels/projects'

export const projects = async (req: Request, res: Response) => {
  const vm = await projectViewModel()
  res.json(vm)
}
```

Simple stuff, not much to explain. Finally in `src/rest/index.ts` add a little express app (and note this is where we create the database connection):

```ts
import * as express from 'express'
import { createConnection } from 'typeorm'

import { projects } from './projects'

(async () => {
  await createConnection()
  const app = express()
  app.use('/projects', projects)
  app.listen(5000, () => console.log('Listening on port 5000'))
})()
```

Run this however you like - I just like to use `ts-node` and run `yarn ts-node src/rest/index.ts`. You can curl it and see the following:

```sh
$ curl http://localhost:5000/projects | json_pp

[
   {
      "categories" : [
         {
            "id" : 1,
            "name" : "Ready to develop"
         }
      ],
      "id" : 1,
      "name" : "Test"
   }
]
```

If you go to `ormconfig.json` and set "logging: true", you can see the SQL that is executed:

```sh
$ yarn ts-node src/rest/index.ts
yarn run v1.22.4
$ /Users/lachlan/code/dump/rest-graphql-kanban/node_modules/.bin/ts-node src/rest/index.ts
Listening on port 5000

query: SELECT "project"."id" AS "project_id", "project"."name" AS "project_name", "categories"."id" AS "categories_id", "categories"."name" AS "categories_name", "categories"."projectId" AS "categories_projectId" FROM "projects" "project" INNER JOIN "categories" "categories" ON "categories"."projectId"="project"."id"
```

You can see we get the projects and categories in a single query - this is important to remember, since we want to avoid the N+1 problem when we implement the GraphQL server!

Implementing the `tasks` and `categories` view models and endpoints is no different to `projects`, so I will leave that as an exercise. You can find the full implementation in the source code.

## Conclusion

This post covered:

- TypeORM
- implementing a REST API
- separating core logic via a view model layer to make it testable
- creating factories to support tests

The next posts will look at a GraphQL server, and the Vue front-end.
