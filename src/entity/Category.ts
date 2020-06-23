import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinTable, JoinColumn } from "typeorm";
import { Project } from "./Project";
import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
@Entity({ name: 'categories' })
export class Category {
  @Field(type => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column()
  name: string

  @Field(type => Project)
  @ManyToOne(type => Project, project => project.categories)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @Column()
  project_id: number
}
