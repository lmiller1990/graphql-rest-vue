export interface SelectProject {
  id: string
  name: string
}

export interface Task {
  id: string
  name: string
  categoryId: string
}

export interface CurrentProject {
  id: string
  name: string
  categories: Category[]
  tasks: Record<string, Task>
}

export interface Category {
  id: string
  name: string
}

export interface FetchProject {
  id: string
  name: string
  categories: Category[]
  tasks: Array<{
    id: string
    name: string
    categories: Category
  }>
}
