import { createConnection } from "typeorm"
import { buildSchema } from "type-graphql"
import { ProjectsResolver } from "./project.resolvers"
import * as express from 'express'
import * as graphqlHTTP from 'express-graphql'
import * as cors from 'cors'

(async() => {
  await createConnection()
  const schema = await buildSchema({
    resolvers: [ProjectsResolver]
  })

  const app = express()
  app.use(cors())
  app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
  }))

  app.listen(4000)
})()
