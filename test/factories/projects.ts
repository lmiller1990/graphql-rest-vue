import { getRepository, DeepPartial } from 'typeorm'

import { Project } from '../../src/entity/Project'

export const createProject = async (attrs: DeepPartial<Project> = {}): Promise<Project> => {
  return getRepository(Project).save({
    name: attrs.name || 'Test project'
  })
}
