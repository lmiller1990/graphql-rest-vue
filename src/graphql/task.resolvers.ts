import { Resolver, Arg, Mutation, InputType, Field, ID } from 'type-graphql'
import { getRepository } from 'typeorm';
import { Task } from '../entity/Task'

@InputType('UpdateTask')
class UpdateTask {
  @Field(type => ID)
  id: number

  @Field(type => ID)
  categoryId: number
}

@Resolver(of => Task)
export class TaskResolver {

  @Mutation(returns => Task)
  async updatingTask(@Arg('task') updateTask: UpdateTask): Promise<Task> {
    const { id, categoryId } = updateTask
    const repo = getRepository(Task)
    await repo.update({ id }, { categoryId })
    return repo.findOne(id)
  }
}
