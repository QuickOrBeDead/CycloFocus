export interface ListItem {
  id: string
  text: string
  completed: boolean
  current: boolean
  order: number
}

export interface List {
  date: string
  items: ListItem[]
}
