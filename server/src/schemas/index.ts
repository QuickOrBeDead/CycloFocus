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
  date: z.string(),
  items: z.array(TaskListItemSchema)
})

export type TaskList = z.infer<typeof TaskListSchema>

export const DailyItemSchema = z.object({
  id: z.string(),
  name: z.string()
})

export type DailyItem = z.infer<typeof DailyItemSchema>

export const SlotItemSchema = z.object({
  id: z.string(),
  slot: z.string(),
  name: z.string()
})

export type SlotItem = z.infer<typeof SlotItemSchema>

export const DayEnum = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
export type Day = z.infer<typeof DayEnum>

export const WeeklyItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  day: DayEnum
})

export type WeeklyItem = z.infer<typeof WeeklyItemSchema>

export const ScheduleSchema = z.object({
  daily: z.array(DailyItemSchema),
  availableSlots: z.array(z.string()),
  currentSlot: z.string().nullish(),
  slots: z.array(SlotItemSchema),
  weekly: z.array(WeeklyItemSchema)
})

export type Schedule = z.infer<typeof ScheduleSchema>