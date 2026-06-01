"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddCustomerForm } from "./add-customer-form"

interface AddCustomerDialogProps {
  triggerLabel?: string
  triggerClassName?: string
  triggerIcon?: boolean
}

export function AddCustomerDialog({
  triggerLabel = "Add New Customer",
  triggerClassName = "h-14 px-8 rounded-2xl bg-[#005259] text-white font-black text-sm flex items-center gap-2 hover:bg-[#0f6c74] transition-all shadow-ambient active:scale-95",
  triggerIcon = true,
}: AddCustomerDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className={triggerClassName}>
          {triggerIcon && <Plus size={20} />} {triggerLabel}
        </button>
      } />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <AddCustomerForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
