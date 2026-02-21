export interface DailyItem {
  id: string;
  name: string;
}

export interface SlotItem {
  id: string;
  slot: string;
  name: string;
}

export interface WeeklyItem {
  id: string;
  name: string;
  day: string;
}

export interface Schedule {
  daily: DailyItem[];
  availableSlots: string[];
  currentSlot?: string | null;
  slots: SlotItem[];
  weekly: WeeklyItem[];
}