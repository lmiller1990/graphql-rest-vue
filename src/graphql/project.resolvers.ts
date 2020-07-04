import { Resolver, Arg, Info, Query } from 'type-graphql'
import { Project } from '../entity/Project';
import { getRepository } from 'typeorm';

@Resolver(of => Project)
export class ProjectsResolver {

  @Query(returns => Project)
  async project(@Arg('id') id: number, @Info() info) {
    const project = await getRepository(Project).findOne(id)

    if (!project) {
      throw Error(`Project with id ${id} not found`)
    }

    return project
  }
}
