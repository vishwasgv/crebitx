"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createCustomer } from "@/app/actions/customers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const customerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  creditLimit: z.coerce.number().default(0),
  paymentCycle: z.coerce.number().default(30),
  gracePeriod: z.coerce.number().default(0),
})

export function AddCustomerForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      paymentCycle: 30,
      creditLimit: 0,
      gracePeriod: 0,
    },
  })

  async function onSubmit(data: z.infer<typeof customerSchema>) {
    setLoading(true)
    const result = await createCustomer(data)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Customer added successfully!")
      router.refresh()
      // Close dialog handled by parent or state
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="name">Customer Name *</Label>
          <Input id="name" {...register("name")} placeholder="Full Name" />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" {...register("phone")} placeholder="10-digit phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="customer@example.com" />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} placeholder="Business address" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
          <Input id="creditLimit" type="number" {...register("creditLimit")} placeholder="0 for unlimited" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentCycle">Payment Cycle (Days)</Label>
          <Select onValueChange={(v) => setValue("paymentCycle", parseInt(v))} defaultValue="30">
            <SelectTrigger>
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="15">15 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="45">45 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
          <Input id="gracePeriod" type="number" {...register("gracePeriod")} placeholder="0" />
        </div>
      </div>
      <Button type="submit" className="w-full bg-crebitx-teal hover:bg-crebitx-teal/90" disabled={loading}>
        {loading ? "Adding..." : "Add Customer"}
      </Button>
    </form>
  )
}
