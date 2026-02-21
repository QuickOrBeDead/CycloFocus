import { api } from "./axios"
import type { Schedule } from "../types/schedule"
import type { List } from "../types/list"

export async function getSchedule(): Promise<Schedule> {
  const res = await api.get<Schedule>(`/schedule`)
  return res.data
}

export async function setSchedule(schedule: Schedule): Promise<List> {
  const res = await api.post<List>("/schedule", schedule)
  return res.data
}