import { getRepository } from 'typeorm'

import { Project } from '../entity/Project'

export const projectViewModel = async (): Promise<Project[]> => {
  return getRepository(Project)
    .createQueryBuilder('project')
    .innerJoinAndSelect('project.categories', 'categories')
    .getMany()
}
