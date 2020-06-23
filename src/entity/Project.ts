import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string
}
