import { createConnection, Connection, getRepository, DeepPartial } from 'typeorm'
import { Project } from '../../entity/Project'
import { createProject } from '../../../test/factories/projects'
import { Category } from '../../entity/Category'
import { createCategory } from '../../../test/factories/categories'
import { buildSchema } from 'type-graphql'
import { ProjectsResolver } from '../project.resolvers'
import { graphql } from 'graphql'

let connection: Connection

beforeAll(async () => {
  connection = await createConnection()
  const repo = getRepository(Project)
  await repo.remove(await repo.find())
})

afterAll(async () => {
  await connection.close()
})

test('project resolvers', async () => {
  const project = await createProject({ name: 'Project' })
  const category = await createCategory({ name: 'Category' }, project)

  const expected = {
    project: {
      id: project.id.toString(),
      name: 'Project',
      categories: [
        {
          id: category.id.toString(),
          name: 'Category'
        }
      ]
    }
  }

  const schema = await buildSchema({
    resolvers: [ProjectsResolver]
  })

  const actual = await graphql({
    schema,
    source: `
      {
        project(id: ${project.id}) {
          id
          name
          categories {
            id
            name
          }
        }
      }
    `
  })

  expect(actual.data).toEqual(expected)
})
