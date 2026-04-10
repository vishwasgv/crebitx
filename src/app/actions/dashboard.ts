"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getDashboardKPIs() {
  const session = await auth()
  if (!session) return null

  const tenantId = session.user.tenantId
  const now = new Date()

  // 1. Total Receivables
  const totalReceivables = await prisma.receivableItem.aggregate({
    where: {
      customer: { tenantId },
      isPaid: false,
    },
    _sum: {
      amount: true,
      paidAmount: true,
    },
  })

  const outstandingAmount = (totalReceivables._sum.amount || 0) - (totalReceivables._sum.paidAmount || 0)

  // 2. Overdue Amount
  const overdueItems = await prisma.receivableItem.aggregate({
    where: {
      customer: { tenantId },
      isPaid: false,
      dueDate: { lt: now },
    },
    _sum: {
      amount: true,
      paidAmount: true,
    },
  })

  const overdueAmount = (overdueItems._sum.amount || 0) - (overdueItems._sum.paidAmount || 0)

  // 3. Expected Inflow (7 Days)
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(now.getDate() + 7)

  const expectedInflow = await prisma.receivableItem.aggregate({
    where: {
      customer: { tenantId },
      isPaid: false,
      dueDate: {
        gte: now,
        lte: sevenDaysLater,
      },
    },
    _sum: {
      amount: true,
      paidAmount: true,
    },
  })

  const inflowAmount = (expectedInflow._sum.amount || 0) - (expectedInflow._sum.paidAmount || 0)

  // 4. Top Outstanding Customers
  const topCustomersRaw = await prisma.customer.findMany({
    where: { tenantId },
    include: {
      receivables: {
        where: { isPaid: false },
      },
    },
  })

  const topCustomers = topCustomersRaw
    .map(c => ({
      name: c.name,
      amount: c.receivables.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // 5. Critical Alerts
  const highRiskCustomers = await prisma.customer.findMany({
    where: {
      tenantId,
      riskSnapshots: {
        some: {
          level: "RED",
        },
      },
    },
    include: {
      riskSnapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 1,
      },
      receivables: {
        where: { isPaid: false, dueDate: { lt: now } },
      },
    },
  })

  const alerts = highRiskCustomers.map(c => ({
    name: c.name,
    amount: c.receivables.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0),
    overdue: `${c.receivables.length} items overdue`,
    phone: c.phone,
  }))

  return {
    outstandingAmount,
    overdueAmount,
    inflowAmount,
    topCustomers,
    alerts,
  }
}
