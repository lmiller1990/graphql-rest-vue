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
  category: Category

  @Field(type => Project)
  @JoinColumn({ name: 'project_id' })
  @ManyToOne(type => Project, project => project.tasks)
  project: Project

  @Field(type => ID)
  @Column({ name: 'project_id' })
  projectId: number

  @Field(type => ID)
  @Column({ name: 'category_id' })
  categoryId: number
}
