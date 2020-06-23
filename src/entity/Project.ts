import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Field, ID, ObjectType } from 'type-graphql'
import { Category } from "./Category";

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
  @OneToMany(type => Category, category => category.project)
  categories: Category[]
}
