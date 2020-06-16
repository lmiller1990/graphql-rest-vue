import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinTable, JoinColumn } from "typeorm";
import { Project } from "./Project";

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @ManyToOne(type => Project, project => project.categories)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @Column()
  project_id: number
}
