import "reflect-metadata";
import {createConnection, useContainer} from "typeorm";
import * as graphqlHTTP from 'express-graphql'
import * as express from 'express'
import { buildSchema } from 'type-graphql'
import { ProjectResolver } from './src/graphql/project.resolver'
import {Container} from "typedi";

useContainer(Container)
createConnection().then(async connection => {
  const schema = await buildSchema({
    resolvers: [ProjectResolver],
    container: Container
  });

  const app = express()
  app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true,
  }))

  app.listen(4000)

}).catch(error => console.log(error));
