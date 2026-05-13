import { Worker } from "bullmq"
import { Redis } from "ioredis"
import { prisma } from "./lib/prisma"
import { calculateRiskScore } from "./lib/risk-engine"

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
})

console.log("Worker starting...")

// 1. Reminder Worker
const reminderWorker = new Worker(
  "reminder-queue",
  async (job) => {
    const { customerId, message } = job.data
    console.log(`Sending reminder to customer ${customerId}: ${message}`)
    
    // Simulate WhatsApp API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await prisma.reminderJob.update({
      where: { id: job.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    })
  },
  { connection }
)

// 2. Scoring Worker
const scoringWorker = new Worker(
  "scoring-queue",
  async (job) => {
    const { customerId } = job.data
    console.log(`Calculating risk score for customer ${customerId}`)
    await calculateRiskScore(customerId)
  },
  { connection }
)

reminderWorker.on("completed", (job) => {
  console.log(`Reminder job ${job.id} completed`)
})

scoringWorker.on("completed", (job) => {
  console.log(`Scoring job ${job.id} completed`)
})

process.on("SIGTERM", async () => {
  await reminderWorker.close()
  await scoringWorker.close()
})
