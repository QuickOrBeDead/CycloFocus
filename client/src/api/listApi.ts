import { api } from "./axios"
import type { List } from "../types/list"

export async function getList(): Promise<List> {
  const res = await api.get<List>("/list")
  return res.data;
}

export async function setList(list: List): Promise<void> {
  await api.post("/list", list)
}