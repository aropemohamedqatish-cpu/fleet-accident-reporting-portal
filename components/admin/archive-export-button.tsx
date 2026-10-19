'use client'

import { useState } from 'react'
import { Archive, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { shortRef } from '@/lib/admin-claims'

export function ArchiveExportButton({ id, plate }: { id: string; plate: string }) {
  const [exporting, setExporting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function exportArchive() {
    setExporting(true)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/incidents/${id}/archive`)
      if (!res.ok) throw new Error('export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `incident-${plate}-${shortRef(id)}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setNotice('تم تصدير الأرشيف الكامل بنجاح.')
    } catch {
      setNotice('تعذّر تصدير الأرشيف. تحقق من الملفات وحاول مجدداً.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
      {notice && <p className="mb-2 text-center text-xs font-medium text-[#003366]" role="status">{notice}</p>}
      <Button type="button" onClick={exportArchive} disabled={exporting} className="h-12 w-full gap-2 bg-[#003366] text-base font-bold hover:bg-[#00264d]">
        {exporting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Archive className="size-5" aria-hidden="true" />}
        {exporting ? 'جارٍ تجهيز الأرشيف...' : 'تصدير الأرشيف بالكامل'}
        {!exporting && <Download className="size-4" aria-hidden="true" />}
      </Button>
      <p className="mt-2 text-center text-xs text-slate-500">تقرير منظم + جميع المرفقات الأصلية بصيغة ZIP</p>
    </div>
  )
}
