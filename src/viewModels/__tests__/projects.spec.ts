import { RestProject, projectViewModel } from '../projects'
import { Connection, createConnection, getRepository } from 'typeorm'
import { createProject, createCategory } from '../../../test/factories/projects'
import { Project } from '../../entity/Project'

let connection: Connection

beforeEach(async () => {
  connection = await createConnection()
  const repo = getRepository(Project)
  await repo.remove(await repo.find())
})

afterEach(async () => {
  await connection.close()
})

test('projectsViewModel', async () => {
  const project = await createProject({ name: 'Test Project' })
  const category = await createCategory({ name: 'Category' }, project)
  const expected: RestProject[] = [
    {
      id: project.id,
      name: 'Test Project',
      categories: [
        {
          id: category.id,
          name: 'Category'
        }
      ]
    }
  ]

  const actual = await projectViewModel()

  expect(actual).toEqual(expected)
})
