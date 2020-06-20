## Add Categories

Let's see how TypeORM handles relationships by adding categories to the view model. Update the definition for `RestProject`:

```ts
interface RestProject {
  id: number
  name: string
  categories: Array<{
    id: number
    name: string
  }>
}
```

Then, update the test:

```ts
import { createCategory } from '../../../test/factories/categories'

// ...

test('projectsViewModel', async () => {
  const project = await createProject({ name: 'Test Project' })
  await createCategory({ name: 'Category' }, project)
  const expected: RestProject[] = [
    {
      id: project.id,
      name: 'Test Project',
      categories: [
        {
          id: 1,
          name: 'Category'
        }
      ]
    }
  ]

  const actual = await projectViewModel()

  expect(actual).toEqual(expected)
})
```

And add `tests/factories/categories.ts`:

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
    project_id: project.id
  })
}
```

We pass in the project as the second argument - `project_id` is a non-nullable column in the `categories` table, so we need to provide one. The test still won't pass yet - read on.

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
  @JoinColumn({ name: 'project_id' })
  project: Project

  @Column()
  project_id: number
}
```

Since we are not using the TypeORM default for the relationship (they use `projectId`), we need to specify the join column using the `JoinColumn` decorator.

Finally, we can update the project view model and the test will pass:

```ts
export const projectViewModel = async (): Promise<Project[]> => {
  const query = await getRepository(Project)
    .createQueryBuilder('project')
    .innerJoinAndSelect('project.categories', 'categories')
    .getMany()

  return query.map(x => ({
    id: x.id,
    name: x.name,
    categories: x.categories.map(y => ({ id: y.id, name: y.name }))
  }))
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

Implementing the `tasks` and `categories` view models and endpoints is no different to `projects`, so I will leave that as an exercise. You can find the full implementation in the [source code](https://github.com/lmiller1990/graphql-rest-vue).
.

## Conclusion

This post covered:

- TypeORM
- implementing a REST API
- separating core logic via a view model layer to make it testable
- creating factories to support tests

The next posts will look at a GraphQL server, and the Vue front-end.
