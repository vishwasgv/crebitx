import { Worker } from "bullmq"
import { Redis } from "ioredis"

/**
 * CREBITX Background Worker
 *
 * NOTE: Risk scoring is now handled fully by the NestJS backend
 * (auto-triggered on every ledger event). This worker handles
 * reminder dispatching and other background jobs that require
 * queue processing on the frontend/client side.
 *
 * For production, consider migrating these workers into the NestJS
 * backend using @nestjs/bull or BullMQ directly.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
const WORKER_API_TOKEN = process.env.WORKER_API_TOKEN || ""

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
})

console.log("CREBITX Worker starting...")

/**
 * Helper: call backend API from worker
 */
async function backendPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(WORKER_API_TOKEN ? { Authorization: `Bearer ${WORKER_API_TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Backend API error ${res.status}: ${text}`)
  }
  return res.json()
}

// 1. Reminder Worker — dispatches reminder notifications via backend
const reminderWorker = new Worker(
  "reminder-queue",
  async (job) => {
    const { customerId, message, channel = "WHATSAPP" } = job.data
    console.log(`[Reminder] Sending ${channel} to customer ${customerId}: ${message}`)

    // Record the reminder outcome via the backend
    await backendPost("/collection-outcomes", {
      customerId,
      channel,
      note: message,
      outcomeStatus: "SENT",
    })

    console.log(`[Reminder] Successfully sent reminder for customer ${customerId}`)
  },
  { connection }
)

// 2. Scoring Worker — triggers a backend risk recalculation
const scoringWorker = new Worker(
  "scoring-queue",
  async (job) => {
    const { customerId } = job.data
    console.log(`[Scoring] Risk recalculation triggered for customer ${customerId}`)
    // Backend auto-recalculates risk on ledger events.
    // This job can be used for periodic forced recalculation.
    // If a dedicated endpoint is added to the backend, call it here.
    console.log(`[Scoring] Done — backend handles auto scoring on ledger events`)
  },
  { connection }
)

reminderWorker.on("completed", (job) => {
  console.log(`[Reminder] Job ${job.id} completed`)
})

reminderWorker.on("failed", (job, err) => {
  console.error(`[Reminder] Job ${job?.id} failed:`, err.message)
})

scoringWorker.on("completed", (job) => {
  console.log(`[Scoring] Job ${job.id} completed`)
})

scoringWorker.on("failed", (job, err) => {
  console.error(`[Scoring] Job ${job?.id} failed:`, err.message)
})

process.on("SIGTERM", async () => {
  console.log("Worker shutting down gracefully...")
  await reminderWorker.close()
  await scoringWorker.close()
  await connection.quit()
})
