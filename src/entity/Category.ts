import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'

import { Project } from './Project'

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @ManyToOne(type => Project, project => project.categories)
  project: Project
}
