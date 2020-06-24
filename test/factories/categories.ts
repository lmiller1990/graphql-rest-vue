
import { getRepository, DeepPartial } from 'typeorm'
import { Category } from '../../src/entity/Category'
import { Project } from '../../src/entity/Project'

export const createCategory = (attrs: DeepPartial<Category>, project: Project): Promise<Category> => {
  const repo = getRepository(Category)
  return repo.save({
    name: attrs.name || 'My Category',
    projectId: project.id
  })
}
