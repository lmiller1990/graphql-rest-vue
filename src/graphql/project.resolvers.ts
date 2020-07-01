import { Query, Resolver, Info, Arg } from 'type-graphql'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import { Project } from '../entity/Project'

interface ProjectsInfo {
}
interface ProjectsArgs {
}

@Resolver(of => Project)
export class ProjectResolver {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>
  ) { }

  @Query(returns => Project)
  async project(
    @Arg('id') id: number,
    @Info() info
  ) {
    // for (const node of info.fieldNodes[0].selectionSet.selections) {
    //   console.log(node)
    // }
    const project = await this.repo.findOne(id)
    if (!project) {
      throw Error(`No project found for id ${id}`)
    }
    return project
  }
}
