import { createConnection, Connection, getRepository, DeepPartial } from 'typeorm'

import { projectViewModel } from '../projects'
import { Project } from '../../entity/Project'

let connection: Connection

beforeAll(async () => {
  connection = await createConnection()
  const repo = getRepository(Project)
  await repo.remove(await repo.find())
})

afterAll(async () => {
  connection.close()
})

export const createProject = async (attrs: DeepPartial<Project> = {}): Promise<Project> => {
  return getRepository(Project).save({
    name: attrs.name || 'Test project'
  })
}

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
