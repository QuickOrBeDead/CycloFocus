import { z } from 'zod'


export const TaskListItemSchema = z.object({
    id: z.uuid(),
    text: z.string().max(50),
    current: z.boolean(),
    completed: z.boolean(),
    order: z.number()
})

export type TakListItem = z.infer<typeof TaskListItemSchema>

export const TaskListSchema = z.object({
  date: z.iso.datetime(),
  items: z.array(TaskListItemSchema)
})

export type TaskList = z.infer<typeof TaskListSchema>

export const ListIdEnum = z.enum(['daily', 'todo'])
export type ListId = z.infer<typeof ListIdEnum>