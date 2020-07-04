import { createConnection } from "typeorm"
import { buildSchema } from "type-graphql"
import { ProjectsResolver } from "./project.resolvers"
import * as express from 'express'
import * as graphHTTP from 'express-graphql'
import graphqlHTTP = require("express-graphql")


(async() => {
  await createConnection()
  const schema = await buildSchema({
    resolvers: [ProjectsResolver]
  })

  const app = express()
  app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
  }))

  app.listen(4000)
})()
