import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Clear existing data
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

  const hashedPassword = await bcrypt.hash("password123", 10)

  // Create Hardware Demo Tenant
  const hardwareTenant = await prisma.tenant.create({
    data: {
      name: "Sunrise Hardware",
      industry: "Hardware",
      config: {
        create: {
          defaultCycle: 15,
          defaultGrace: 3,
          reminderTone: "BALANCED",
        },
      },
    },
  })

  // Create Owner User
  const owner = await prisma.user.create({
    data: {
      name: "Vishwajeet",
      email: "owner@crebitx.com",
      phone: "9876543210",
      password: hashedPassword,
      tenants: {
        create: {
          tenantId: hardwareTenant.id,
          role: "OWNER",
        },
      },
    },
  })

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: hardwareTenant.id,
      name: "Global Tech Corp",
      phone: "9123456789",
      creditProfile: {
        create: {
          creditLimit: 200000,
          paymentCycle: 15,
        },
      },
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: hardwareTenant.id,
      name: "Ravi Textiles",
      phone: "9876543210",
      creditProfile: {
        create: {
          creditLimit: 50000,
          paymentCycle: 30,
        },
      },
    },
  })

  // Add Sales
  await prisma.ledgerEvent.create({
    data: {
      tenantId: hardwareTenant.id,
      customerId: customer1.id,
      amount: 140000,
      tag: "SALE",
      note: "Initial bulk order",
    },
  })

  const dueDate1 = new Date()
  dueDate1.setDate(dueDate1.getDate() - 5) // Overdue

  await prisma.receivableItem.create({
    data: {
      customerId: customer1.id,
      amount: 140000,
      dueDate: dueDate1,
      description: "Initial bulk order",
    },
  })

  await prisma.ledgerEvent.create({
    data: {
      tenantId: hardwareTenant.id,
      customerId: customer2.id,
      amount: 45000,
      tag: "SALE",
      note: "Sample batch",
    },
  })

  const dueDate2 = new Date()
  dueDate2.setDate(dueDate2.getDate() - 12) // Critical overdue

  await prisma.receivableItem.create({
    data: {
      customerId: customer2.id,
      amount: 45000,
      dueDate: dueDate2,
      description: "Sample batch",
    },
  })

  // Create Risk Snapshots
  await prisma.riskScoreSnapshot.create({
    data: {
      customerId: customer2.id,
      score: 35,
      level: "RED",
      reason: "Critical: Overdue by 12 days",
    },
  })

  console.log("Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
