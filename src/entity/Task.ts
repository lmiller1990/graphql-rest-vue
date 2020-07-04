import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm'
import { ObjectType, ID, Field } from 'type-graphql'
import { Category } from './Category'
import { Project } from './Project'

@ObjectType()
@Entity({ name: 'tasks' })
export class Task {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column()
  name: string

  @Field(type => Category)
  @JoinColumn({ name: 'category_id' })
  @ManyToOne(type => Category, category => category.tasks, {
    eager: true
  })
  categories: Category[]

  @Field(type => Project)
  @JoinColumn({ name: 'project_id' })
  @ManyToOne(type => Project, project => project.tasks)
  project: Project

  @Column({ name: 'project_id' })
  projectId: number

  @Column({ name: 'category_id' })
  categoryId: number
}
