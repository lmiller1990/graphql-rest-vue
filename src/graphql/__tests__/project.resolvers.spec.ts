import { createConnection, Connection, getRepository, Repository } from 'typeorm'
import { Container } from 'typedi'
import { graphql } from 'graphql'
import { buildSchema } from 'type-graphql'

import { Project } from '../../entity/Project'
import { createProject } from '../../../test/factories/projects'
import { createCategory } from '../../../test/factories/categories'
import { ProjectResolver } from '../project.resolvers'

let connection: Connection
let repo: Repository<Project>

beforeAll(async () => {
  connection = await createConnection()
  repo = getRepository(Project)
  await repo.remove(await repo.find())
})

afterAll(async () => {
  await connection.close()
})

test('project resolver', async () => {
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
    resolvers: [ProjectResolver],
    container: Container
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
