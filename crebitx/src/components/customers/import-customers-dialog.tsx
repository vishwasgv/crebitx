"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, FileText } from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { importCustomers } from "@/app/actions/import"

function parseCsv(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as any[]),
      error: reject,
    })
  })
}

async function parseExcel(file: File) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []
  const sheet = workbook.Sheets[firstSheetName]
  return XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[]
}

async function parseCustomerFile(file: File) {
  const name = file.name.toLowerCase()
  if (name.endsWith(".csv")) return parseCsv(file)
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return parseExcel(file)
  throw new Error("Upload CSV, XLS, or XLSX file only")
}

export function ImportCustomersDialog() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    try {
      setFile(selectedFile)
      const rows = await parseCustomerFile(selectedFile)
      setPreview(rows.slice(0, 5))
    } catch (error: any) {
      setFile(null)
      setPreview([])
      toast.error(error?.message || "Could not read file")
    }
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)

    try {
      const rows = await parseCustomerFile(file)
      const res = await importCustomers(rows)
      if (res.success && "count" in res) {
        toast.success(`Successfully imported ${res.count} customers!`)
        router.refresh()
        setFile(null)
        setPreview([])
      } else {
        toast.error(res.error || "Import failed")
      }
    } catch (error: any) {
      toast.error(error?.message || "Import failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={
        <Button variant="outline" className="border-stone-200">
          <Upload size={18} className="mr-2" /> Bulk Import
        </Button>
      } />
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Customers from CSV or Excel</DialogTitle>
          <DialogDescription>
            Upload a CSV, XLS, or XLSX file with headers: name, phone, email, address, creditLimit, paymentCycle.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="relative border-2 border-dashed border-stone-200 rounded-xl p-8 text-center space-y-4 hover:border-crebitx-teal/50 transition-colors bg-stone-50/50">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <FileText size={24} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-stone-700">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-stone-400 font-medium">CSV, XLS, or XLSX files only</p>
            </div>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            {file && (
              <Button
                variant="ghost"
                size="sm"
                className="relative z-10 text-red-500 font-bold text-[10px] uppercase"
                onClick={() => { setFile(null); setPreview([]) }}
              >
                Remove File
              </Button>
            )}
          </div>

          {preview.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Preview (First 5 rows)</h4>
              <div className="bg-stone-50 rounded-lg border overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b bg-stone-100/50">
                      {Object.keys(preview[0]).map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-stone-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-3 py-2 font-medium text-stone-600">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            className="bg-crebitx-teal hover:bg-crebitx-teal/90 w-full"
            disabled={!file || loading}
            onClick={handleImport}
          >
            {loading ? "Importing..." : "Start Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
