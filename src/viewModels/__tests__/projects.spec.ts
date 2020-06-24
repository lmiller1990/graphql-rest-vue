import { projectViewModel, RestProject } from '../projects'
import { createConnection, Connection, getRepository, DeepPartial } from 'typeorm'
import { Project } from '../../entity/Project'
import { createProject } from '../../../test/factories/projects'
import { Category } from '../../entity/Category'
import { createCategory } from '../../../test/factories/categories'

let connection: Connection

beforeAll(async () => {
  connection = await createConnection()
  const repo = getRepository(Project)
  await repo.remove(await repo.find())
})

afterAll(async () => {
  await connection.close()
})

test('project view model', async () => {
  const project = await createProject({ name: 'Project' })
  const category = await createCategory({ name: 'Category' }, project)

  const expected: RestProject[] = [
    {
      id: project.id,
      name: 'Project',
      categories: [
        {
          id: category.id,
          name: 'Category'
        }
      ]
    }
  ]

  const p = await getRepository(Project).findOne({ id: project.id })
  console.log(p.categories)

  const actual = await projectViewModel()

  expect(actual).toEqual(expected)
})
