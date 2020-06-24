import * as express from 'express'
import { createConnection } from 'typeorm'
import { projects } from './projects'

(async () => {
  await createConnection()
  const app = express()
  app.use('/projects', projects)
  app.listen(5000)
})()
