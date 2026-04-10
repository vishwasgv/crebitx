import { prisma } from "./prisma"

export async function calculateRiskScore(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      creditProfile: true,
      receivables: {
        where: { isPaid: false },
        orderBy: { dueDate: "asc" },
      },
    },
  })

  if (!customer) return

  let score = 100 // Starting with perfect score
  let reason = "Healthy payment history"
  let level: "GREEN" | "YELLOW" | "RED" = "GREEN"

  const now = new Date()
  const receivables = customer.receivables
  const profile = customer.creditProfile

  // 1. Overdue check
  const oldestOverdue = receivables.find(r => r.dueDate < now)
  if (oldestOverdue) {
    const diffDays = Math.ceil((now.getTime() - oldestOverdue.dueDate.getTime()) / (1000 * 3600 * 24))
    
    if (diffDays > 30) {
      score -= 60
      level = "RED"
      reason = `Critical: Overdue by ${diffDays} days`
    } else if (diffDays > 7) {
      score -= 30
      level = "YELLOW"
      reason = `Warning: Overdue by ${diffDays} days`
    } else {
      score -= 10
      reason = `Minor: Overdue by ${diffDays} days`
    }
  }

  // 2. Credit limit check
  if (profile && profile.creditLimit > 0) {
    const totalOutstanding = receivables.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0)
    if (totalOutstanding > profile.creditLimit) {
      score -= 20
      if (level !== "RED") level = "YELLOW"
      reason += `. Credit limit exceeded (Outstanding: ₹${totalOutstanding.toLocaleString()})`
    }
  }

  // Ensure score stays within 0-100
  score = Math.max(0, Math.min(100, score))

  // Update level based on final score if not already set by critical condition
  if (score < 40) level = "RED"
  else if (score < 75) level = "YELLOW"

  // Save snapshot
  await prisma.riskScoreSnapshot.create({
    data: {
      customerId,
      score,
      level,
      reason,
    },
  })

  return { score, level, reason }
}
