import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinTable } from "typeorm";
import { Category } from "./Category";

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @OneToMany(type => Category, category => category.project)
  categories: Category[]
}
