import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: any };

const createMockPrisma = () => {
  const mockData: Record<string, any> = {
    customer: {
      findMany: () => [
        { id: "mock-1", name: "Global Tech Solutions", phone: "9876543210", email: "contact@globaltech.com" },
        { id: "mock-2", name: "Acme Corp Industries", phone: "9123456789", email: "sales@acme.com" },
        { id: "mock-3", name: "Surat Textile Hub", phone: "9988776655", email: "info@surathub.com" }
      ],
      findUnique: () => ({
        id: "mock-1",
        name: "Global Tech Solutions",
        phone: "9876543210",
        email: "contact@globaltech.com",
        address: "123 Business Park, Bangalore",
        creditProfile: { creditLimit: 500000, paymentCycle: 30, gracePeriod: 5 },
        receivables: [
          { id: "r1", amount: 150000, paidAmount: 0, dueDate: new Date(Date.now() - 86400000 * 5), description: "Invoice #GT-102" },
          { id: "r2", amount: 95000, paidAmount: 0, dueDate: new Date(Date.now() + 86400000 * 10), description: "Invoice #GT-115" },
        ],
        ledgerEvents: [
          { id: "l1", amount: 150000, tag: "SALE", note: "Invoice #GT-102", eventDate: new Date(Date.now() - 86400000 * 35) },
          { id: "l2", amount: 95000, tag: "SALE", note: "Invoice #GT-115", eventDate: new Date(Date.now() - 86400000 * 20) },
        ],
        riskSnapshots: [{ level: "RED", score: 45, snapshotDate: new Date() }],
      }),
      findFirst: () => null,
    },
    receivableItem: {
      aggregate: () => ({ _sum: { amount: 1458000, paidAmount: 0 } }),
    },
    tenantUser: {
      findFirst: () => ({ tenantId: "demo-tenant", role: "OWNER" }),
    },
    settings: {
      findUnique: () => ({ whatsappEnabled: true, emailEnabled: true, lowConfidenceThreshold: 0.7 }),
    }
  };

  return new Proxy({}, {
    get: (target, prop) => {
      const model = String(prop);
      if (model === "$transaction") return async (fn: any) => await fn(createMockPrisma());
      if (model === "$connect") return async () => {};
      if (model === "$disconnect") return async () => {};
      
      return new Proxy({}, {
        get: (target, method) => {
          return async () => {
            console.warn(`Prisma: ${model}.${String(method)} (Mock Mode)`);
            const mockModel = mockData[model];
            if (mockModel && mockModel[method as keyof typeof mockModel]) {
              return mockModel[method as keyof typeof mockModel]();
            }
            if (method === "findMany") return [];
            if (method === "aggregate") return { _sum: { amount: 0, paidAmount: 0 } };
            return null;
          };
        }
      });
    }
  });
};

export const prisma = (() => {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder")) {
    return createMockPrisma();
  }
  
  try {
    return globalForPrisma.prisma || new PrismaClient({ log: ["query"] });
  } catch (e) {
    console.error("Prisma Initialization Failed, falling back to Mock.");
    return createMockPrisma();
  }
})();

if (process.env.NODE_ENV !== "production" && process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma;
}
