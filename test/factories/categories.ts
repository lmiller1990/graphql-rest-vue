import { DeepPartial, getRepository } from 'typeorm'

import { Category } from '../../src/entity/Category'
import { Project } from '../../src/entity/Project'

export const createCategory = (
  category: DeepPartial<Category>,
  project: Project
) => {
  return getRepository(Category).save({
    name: category.name,
    project
  })
}
