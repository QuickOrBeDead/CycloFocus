import express, { Request, Response } from "express"
import redisClient from "./redisClient.js"
import { Day, Schedule, ScheduleSchema, TaskList, TaskListSchema } from "./schemas/index.js"
import { validateBody } from "./middleware/validate.js"
import path from "path"
import { fileURLToPath } from "url"

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend Express Request type to include redis client
declare global {
  namespace Express {
    interface Request {
      redis: typeof redisClient
    }
  }
}

const app = express();
app.use(express.json());

app.use((req, _, next) => {
  req.redis = redisClient;
  next();
});

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getSchedule = async (req: Request): Promise<Schedule> => {
  const key = "schedule";
  const value = await req.redis.get(key);
  if (!value) {
    return {
      availableSlots: ['A'],
      currentSlot: 'A',
      daily: [],
      slots: [],
      weekly: []
    };
  }

  const rawData = JSON.parse(value);
  return ScheduleSchema.parse(rawData);
};

const setSchedule = async (req: Request, schedule: Schedule) => {
  await req.redis.set("schedule", JSON.stringify(schedule));
};

const getTaskList = async (req: Request): Promise<TaskList | null> => {
  const key = "list";
  const value = await req.redis.get(key);
  if (!value) {
    return null;
  }

  const rawData = JSON.parse(value);
  return TaskListSchema.parse(rawData);
};

const setTaskList = async (req: Request, taskList: TaskList) => {
  await req.redis.set("list", JSON.stringify(taskList));
}

const getDateString = (now: Date) => {
  return `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}`;
}

const getTodaysTaskList = async (req: Request) => {
  const now = new Date();
  const today = getDateString(now);
  const taskList = await getTaskList(req);
  if (taskList && taskList.date === today) {
    return taskList;
  }

  const schedule = await getSchedule(req);
  const newTaskList: TaskList = {
    date: today,
    items: []
  };

  let nextSlot: string | null = null;
  if (!schedule.currentSlot) {
    nextSlot = schedule.availableSlots[0] || null;
  } else {  
    const currentIndex = schedule.availableSlots.indexOf(schedule.currentSlot);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % schedule.availableSlots.length;
      nextSlot = schedule.availableSlots[nextIndex];
    } else {
      nextSlot = schedule.availableSlots[0] || null;
    }
  }

  newTaskList.items = getTodaysTasksForSlot(schedule, nextSlot, now);
  schedule.currentSlot = nextSlot;
  await setSchedule(req, schedule);
  await setTaskList(req, newTaskList);

  return newTaskList;
};

const getTodaysTasksForSlot = (schedule: Schedule, slotName: string | null | undefined, now: Date) => {
  let orderCounter = 0;
  const items = [
      ...schedule.daily.map(item => ({
        id: item.id,
        text: item.name,
        current: false,
        completed: false,
        order: orderCounter++
      })),
      ...schedule.slots
        .filter(slot => slot.slot === slotName)
        .map(slot => ({
          id: slot.id,
          text: slot.name,
          current: false,
          completed: false,
          order: orderCounter++
        })),
      ...schedule.weekly
        .filter(weekly => weekly.days && weekly.days.includes(dayNames[now.getDay()] as Day))
        .map(weekly => ({
          id: weekly.id,
          text: weekly.name,
          current: false,
          completed: false,
          order: orderCounter++
        }))
    ];

  return items;
};

const updateTodaysTaskList = async (req: Request, schedule: Schedule): Promise<TaskList> => {
  const list = await getTaskList(req);
  const now = new Date();
  const today = getDateString(now);

  if (list && list.date == today) {
    const todaysTaskList = getTodaysTasksForSlot(schedule, schedule.currentSlot, now);
    let maxOrder = todaysTaskList.reduce((max, item) => Math.max(max, item.order), 0);
    
    const newList: TaskList = {
      date: list.date,
      items: [
        ...todaysTaskList.map(task => {
          const existing = list.items.find(item => item.id === task.id);
          return {
            ...task,
            current: existing?.current || false,
            completed: existing?.completed || false,
            order: existing?.order ?? task.order
          }
        }),
        ...(list.items.filter(item => !todaysTaskList.some(task => task.id === item.id)) || []).map(item => ({
          ...item,
          current: false,
          completed: false,
          order: ++maxOrder
        }))
      ]
    };

    await setTaskList(req, newList);
    return newList;
  } else {
    return await getTodaysTaskList(req);
  }
};

/**
 * Health check
 */
app.get("/health", async (req, res) => {
  try {
    await req.redis.ping();

    res.json({
      status: "ok",
      redis: "ok"
    });
  } catch {
    res.status(500).json({
      status: "error",
      redis: "down"
    });
  }
});

/**
 * SET list (persistent)
 */
app.post("/api/list", 
  validateBody(TaskListSchema),
  async (req: Request<any, TaskList>, res: Response) => {
    try {
      const key = "list";
      await req.redis.set(key, JSON.stringify(req.body));

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "SET list failed" });
    }
  }
);

/**
 * GET list
 */
app.get("/api/list", async (req: Request<any, any>, res: Response) => {
  try {
    res.json(await getTodaysTaskList(req));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GET list failed" });
  }
});

/**
 * SET schedule (persistent)
 */
app.post("/api/schedule", 
  validateBody(ScheduleSchema),
  async (req: Request<any, any, Schedule>, res: Response) => {
    try {
      const schedule = ScheduleSchema.parse(req.body);  
      await setSchedule(req, schedule);
      res.json(await updateTodaysTaskList(req, schedule));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "SET schedule failed" });
    }
  }
);

/**
 * GET schedule
 */
app.get("/api/schedule", async (req: Request<any>, res: Response) => {
  try {
    res.json(await getSchedule(req));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GET Schedule failed" });
  }
});

// Serve static files from the "public" folder (where we'll copy the Vite dist)
app.use(express.static(path.join(__dirname, "public")));

// Handle SPA routing: forward all non-API hits to index.html
app.get("/*any", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = parseInt(process.env.PORT || "3000", 10);

const server = app.listen(PORT, () => {
  console.log(`API running on :${PORT}`);
});

/**
 * Graceful shutdown
 */
async function shutdown(signal: any) {
  console.log(`Shutting down (${signal})`);
  server.close(async () => {
    await redisClient.quit();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);