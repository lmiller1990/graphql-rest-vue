import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Project } from './Project'
import { ObjectType, ID, Field } from 'type-graphql'

@ObjectType()
@Entity({ name: 'categories' })
export class Category {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column()
  name: string

  @Column({ name: 'project_id' })
  projectId: number

  @ManyToOne(type => Project, project => project.categories)
  @JoinColumn({ name: 'project_id' })
  project: Project
}
