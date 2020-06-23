import { projectViewModel, RestProject } from '../projects'
import { createConnection, Connection, getRepository, DeepPartial } from 'typeorm'
import { Project } from '../../entity/Project'

let connection: Connection

beforeAll(async () => {
  connection = await createConnection()
  const repo = getRepository(Project)
  await repo.remove(await repo.find())
})

afterAll(async () => {
  await connection.close()
})

export const createProject = (attrs: DeepPartial<Project>): Promise<Project> => {
  const repo = getRepository(Project)
  return repo.save({
    name: attrs.name || 'My new project'
  })
}

test('project view model', async () => {
  const project = await createProject({ name: 'Project' })
  const expected: RestProject[] = [
    {
      id: project.id,
      name: 'Project'
    }
  ]

  const actual = await projectViewModel()

  expect(actual).toEqual(expected)
})
