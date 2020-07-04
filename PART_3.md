In the previous two articles, we looked at how to use TypeORM and Express to create a REST API in a modular, testable fashion. This lay the groundwork for our real goal: a GraphQL server.

To build a GraphQL server and get a great TypeScript experience, we need a few libraries.

You can find the source code for this article [here](https://github.com/lmiller1990/graphql-rest-vue).

- [`express-graphql`](https://github.com/graphql/express-graphql) and `graphql`. `graphql` is a **JavaScript** implementation of GraphQL. `express-graphql` just wraps it nicely for us.
- [`type-graphql`](https://github.com/MichalLytek/type-graphql). This will give us some decorators we can use to bridge the gap from GraphQL schema and our ORM (TypeORM in this case).

I don't normally like to use too many libraries, but this is the best combination of libraries I've found to work with GraphQL and TypeScript.

The goal will to be have a single endpoint, from which we can query for projects, tasks and categories:

```json
{
  projects(id: 1) {
    tasks {
      id
      name
      category {
        id
      }
    }
  }
}
```

Let's get started!

## Decorators type-graphql

One of the nice things about `type-graphql` is it also uses a decorator based API, which fits well with TypeORM. The first thing we need to do is specify which classes and fields are going to be exposed via our Graph API. For now, let's just update `Project` and `Category`:

```ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Field, ID, ObjectType } from 'type-graphql'
import { Category } from './Category'

@ObjectType()
@Entity({ name: 'projects' })
export class Project {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column()
  name: string

  @Field(type => [Category])
  @OneToMany(type => Category, category => category.project)
  categories: Category[]
}
```

I imported `Field`, `ID`, and `ObjectType` from `type-graphql` and applied them in the same way I applied the TypeORM decorators. They are written in a similar fashion to the TypeORM decorators - specifically, they take a callback which has one argument, usually named `type`, which specfies the type. Instead of `Category[]`, to specify an array we write the `[Category]` syntax. `ObjectType` is a bit of an ambiguous name; `GraphQLObject` would probably be more clear. Naming is tough, I guess? `Category` looks similar:

```ts
import { ObjectType, Field, ID } from 'type-graphql'
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Project } from './Project'

@ObjectType()
@Entity({ name: 'categories' })
export class Category {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column()
  name: string

  @Column({ name: 'project_id' })
  projectId: number

  @ManyToOne(type => Project, project => project.categories)
  @JoinColumn({ name: 'project_id' })
  project: Project
}
```

## The GraphQL Endpoint

Before we work on the **resolvers**, which is analagous to the View Model from the REST endpoint we made, let's create the GraphQL HTTP endpoint. I made a file called `src/graphql/index.ts`. There is a bit going on here - see below for an explanation.

```ts
import 'reflect-metadata'
import { createConnection, useContainer } from 'typeorm'
import * as graphqlHTTP from 'express-graphql'
import * as express from 'express'
import { buildSchema } from 'type-graphql'

import { ProjectResolver } from './project.resolvers'

(async () => {
  const connection = await createConnection()
  const schema = await buildSchema({
    resolvers: [ProjectResolver],
    container: Container
  })
  const app = express()
  app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
  }))
  app.listen(4000)
})()
```

The only part here actually required for a GraphQL server is `buildSchema` and the express app. The last thing we need before we see some GraphQL goodness is the `ProjectResolver`.

## Creating the ProjectResolver

Resolvers in GraphQL are what takes in the query from the client, figures out what to load, and returns what the client asked for. In our case, they will run some SQL queries - same as the View Model from the REST API. Let's see some code, and talk about it:

```ts
import { Query, Resolver, Arg } from 'type-graphql'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import { Project } from '../entity/Project'

@Resolver(of => Project)
export class ProjectResolver {

  @Query(returns => [Project])
  async projects(@Arg('id') id: number) {
    const project = await this.repo.findOne(id)
    if (!project) {
      throw Error(`No project found for id ${id}`)
    }
    return project
  }
}
```

This is enough to get us up and running. Start your GraphQL server - I like to use `ts-node` in development. I run it in watch mode with `yarn ts-node-dev src/graphql/index.ts`. I can run a query by visiting `http://localhost:4000/graphql`:

SS1

Fun stuff! But we just tested by hand - let's automate this a bit.

## Writing a Resolver Test

The previous article covers most of this snippet, so let's see the test first. You might try and do something like this we with REST endpoint:

```ts
test('project resolver', async () => {
  const project = await createProject({ name: 'Project' })
  const category = await createCategory({ name: 'Category' }, project)

  const expected = {
    id: project.id,
    name: 'Project',
    categories: [
      {
        id: category.id,
        name: 'Category'
      }
    ]
  }
  const resolver = new ProjectResolver(repo)
  const actual = await resolver.project(id: project.id)

  expect(actual).toEqual(expected)
})
```

This won't work out too well for a number of reasons. Firstly, we are not loading the categories eagerly - so this would be failing. Even if we did, though, it is not as simple as just creating a new `ProjectResolver` and passing in the arguments - since we are using `type-graphql` decorators, to test the resolver as it behaves in production we need to create new `graphql` instance, similar to what we do in `src/graphql/index.ts`. Before doing this, however, we need a few prerequisites:

- create a database connection
- create a graphql instance

Update the test to use a `graphql` instance, and query it like we did in the GraphiQL UI. It's a lot of code - this is closer to an end to end, or integration test, than a unit test. That's fine - not everything has to be super granular or modular. This way, we get more coverage, and we are testing in a similar manner to production.

```ts
import { createConnection, Connection, getRepository, Repository } from 'typeorm'
import { Container } from 'typedi'
import { graphql } from 'graphql'
import { buildSchema } from 'type-graphql'

import { Project } from '../../entity/Project'
import { createProject } from '../../../test/factories/projects'
import { createCategory } from '../../../test/factories/categories'
import { ProjectResolver } from '../project.resolvers'

let connection: Connection
let repo: Repository<Project>

beforeAll(async () => {
  connection = await createConnection()
  repo = getRepository(Project)
  await repo.remove(await repo.find())
})

afterAll(async () => {
  await connection.close()
})

test('project resolver', async () => {
  const project = await createProject({ name: 'Project' })
  const category = await createCategory({ name: 'Category' }, project)

  const expected = {
    project: {
      id: project.id.toString(),
      name: 'Project',
      categories: [
        {
          id: category.id.toString(),
          name: 'Category'
        }
      ]
    }
  }

  const schema = await buildSchema({
    resolvers: [ProjectResolver],
    container: Container
  })

  const actual = await graphql({
    schema,
    source: `
      {
        project(id: ${project.id}) {
          id
          name
          categories {
            id
            name
          }
        }
      }
    `
  })

  expect(actual.data).toEqual(expected)
})
```

I discuss more about query optimization in the accompanying screencast. Check it out!

## Conclusion

This article covered a lot of content:

- setting up a GraphQL server using `type-graphql`, TypeORM and some utils
- Jest `setupFiles`
- Querying a GraphQL endpoint

In the next article and screencast we will start building the front-end using Vue.js 3, powered by our GraphQL endpoint.

