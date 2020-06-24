import { getRepository, DeepPartial } from 'typeorm'
import { Project } from '../../src/entity/Project'

export const createProject = (attrs: DeepPartial<Project>): Promise<Project> => {
  const repo = getRepository(Project)
  return repo.save({
    name: attrs.name || 'My new project'
  })
}
