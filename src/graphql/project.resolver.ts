import { Resolver, Query, Arg, Args, ArgsType, Field, Int } from "type-graphql";
import { Project } from "../entity/Project";
import { Min } from "class-validator";
import { getRepository, Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { projectViewModel } from "../viewModels/projects";

export class ProjectService {
  async findById(id: number) {
    const repo = getRepository(Project)
    return repo.findOne({ id })
  }
}

@ArgsType()
class ProjectArgs {
  @Field(type => Int)
  @Min(0)
  skip: number = 0

  @Field(type => Int)
  @Min(1)
  take: number = 0
}

@Resolver(of => Project)
export class ProjectResolver {
  constructor(@InjectRepository(Project) private readonly projectRepository: Repository<Project>) {
    console.log(projectRepository)
  }

  @Query(returns => Project)
  async project(@Arg('id') id: number) {
    const p = await this.projectRepository
      .createQueryBuilder('project')
      .innerJoinAndSelect('project.categories', 'category')
      .where({ id })
      .getOne()
      return p
    // const project = await this.projectRepository.findOne({ id })
    // return project
  }

  @Query(returns => [Project])
  projects(@Args() { skip, take }: ProjectArgs) {
    // return this.projectService.findAll({ skip, take })
  }
}
