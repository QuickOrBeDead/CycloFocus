import express, { Request, Response } from "express"
import redisClient from "./redisClient.js"
import { ListId, ListIdEnum, TaskList, TaskListSchema } from "./schemas/index.js"
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

const app = express()
app.use(express.json())

app.use((req, _, next) => {
  req.redis = redisClient
  next()
});

/**
 * Health check
 */
app.get("/health", async (req, res) => {
  try {
    await req.redis.ping()

    res.json({
      status: "ok",
      redis: "ok"
    })
  } catch {
    res.status(500).json({
      status: "error",
      redis: "down"
    })
  }
})

/**
 * SET list (persistent)
 */
app.post("/api/list/:id", 
  validateBody(TaskListSchema),
  async (req: Request<{id: ListId}, any, TaskList>, res: Response) => {
  try {
    const idResult = ListIdEnum.safeParse(req.params.id)
    if (!idResult.success) {
      return res.status(400).json({ errors: [idResult.error] })
    }

    const key = `list:${req.params.id}`

    await req.redis.set(key, JSON.stringify(req.body))

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "SET failed" })
  }
})

/**
 * GET list
 */
app.get("/api/list/:id", async (req: Request<{id: ListId}, any>, res: Response) => {
  try {
    const idResult = ListIdEnum.safeParse(req.params.id)
    if (!idResult.success) {
      return res.status(400).json({ errors: [idResult.error] })
    }

    const key = `list:${req.params.id}`

    const value = await req.redis.get(key)
    if (!value) {
      const emptyList: TaskList = { date: new Date().toISOString(), items: [] }
      return res.json(emptyList)
    }

    const rawData = JSON.parse(value)
    const validatedList: TaskList = TaskListSchema.parse(rawData)
    res.json(validatedList)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "GET failed" })
  }
})

// Serve static files from the "public" folder (where we'll copy the Vite dist)
app.use(express.static(path.join(__dirname, "public")));

// Handle SPA routing: forward all non-API hits to index.html
app.get("/*any", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = parseInt(process.env.PORT || "3000", 10)

const server = app.listen(PORT, () => {
  console.log(`API running on :${PORT}`)
})

/**
 * Graceful shutdown
 */
async function shutdown(signal: any) {
  console.log(`Shutting down (${signal})`)
  server.close(async () => {
    await redisClient.quit()
    process.exit(0)
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)