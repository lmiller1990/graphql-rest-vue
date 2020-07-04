import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Category } from './Category'
import { ObjectType, ID, Field } from 'type-graphql'
import { Task } from './Task'

@ObjectType()
@Entity({ name: 'projects' })
export class Project {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column()
  name: string

  @Field(type => [Category])
  @OneToMany(type => Category, category => category.project, {
    eager: true
  })
  categories: Category[]

  @Field(type => [Task])
  @OneToMany(type => Task, task => task.project, {
    eager: true
  })
  tasks: Task[]
}
