import { createConnection, Connection } from 'typeorm'

import { projectViewModel } from '../projects'
import { createProject } from '../../../test/factories/projects'
import { createCategory } from '../../../test/factories/categories'

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
      name: 'Test',
      // categories: [
      //   {
      //     id: category.id,
      //     name: 'Ready to develop'
      //   }
      // ]
    }
  ])
})
