import { getRepository } from "typeorm"
import { Project } from "../entity/Project"

export interface RestProject {
  id: number
  name: string
}

export const projectViewModel = async (): Promise<RestProject[]> => {
  const query = await getRepository(Project)
  .createQueryBuilder('project')
  .getMany()

  return query.map(x => ({
    id: x.id,
    name: x.name,
  }))
}
