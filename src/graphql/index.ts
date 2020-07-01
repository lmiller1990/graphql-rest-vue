import 'reflect-metadata'
import { createConnection, useContainer } from 'typeorm'
import * as graphqlHTTP from 'express-graphql'
import * as express from 'express'
import { buildSchema } from 'type-graphql'
import { Container } from 'typedi'

import { ProjectResolver } from './project.resolvers'

(async () => {
  useContainer(Container)
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
