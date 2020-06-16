import { DeepPartial, getRepository, Connection } from 'typeorm'
import { Project } from '../../src/entity/Project'
import { Category } from '../../src/entity/Category'
import { projectViewModel } from '../../src/viewModels/projects'

export const createProject = async (attrs: DeepPartial<Project>) => {
  return getRepository(Project).save({
    name: attrs.name || 'Test project'
  })
}


export const createCategory = async (attrs: DeepPartial<Category>, project: Project) => {
  return getRepository(Category).save({
    name: attrs.name || 'Test Cat',
    project_id: project.id
  })
}

