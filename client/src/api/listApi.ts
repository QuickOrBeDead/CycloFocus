import { api } from "./axios"
import type { List } from "../types/list"

export async function getList(id: string): Promise<List> {
  const res = await api.get<List>(`/list/${id}`)
  return res.data;
}

export async function setList(id: string, list: List): Promise<void> {
  await api.post(`/list/${id}`, list)
}