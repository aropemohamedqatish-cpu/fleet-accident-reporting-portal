'use client'

import { useState } from 'react'
import { FileSearch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from './status-badge'
import { IncidentDrawer, useIncidentDrawer } from './incident-drawer'
import { VEHICLE_CLASS_LABELS, formatDateTime, shortRef, type IncidentDetail, type IncidentRow } from '@/lib/admin-claims'

export function ClaimsTable({ rows, total }: { rows: IncidentRow[]; total: number }) {
  const { selected, setSelected, close } = useIncidentDrawer()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  async function openDetail(id: string) {
    setLoadingId(id)
    setLoadError(null)
    try {
      const res = await fetch(`/api/admin/incidents/${id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('load failed')
      const detail = (await res.json()) as IncidentDetail
      setSelected(detail)
    } catch {
      setLoadError('تعذّر تحميل تفاصيل البلاغ. يرجى المحاولة مجدداً.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      <Card className="overflow-hidden border-0 bg-white rounded-[20px] border border-slate-100 shadow-sm">
        <CardHeader className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <CardTitle className="text-lg font-bold text-slate-950">سجل البلاغات</CardTitle>
            <p className="mt-1 text-sm text-slate-600">اضغط على أي صف لعرض التفاصيل الكاملة، صور الحادث، والفيديو المرفق.</p>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-slate-600 border-slate-200 bg-slate-50">
            {rows.length} من {total}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loadError && (
            <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm font-medium text-red-800" role="alert">{loadError}</p>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-100">
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">المرجع</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">رقم اللوحة</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">فئة المركبة</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">اسم السائق</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">وقت التسجيل</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">المرفقات</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-14 text-center">
                      <FileSearch className="mx-auto mb-3 size-10 text-slate-400" aria-hidden="true" />
                      <p className="font-semibold text-slate-900">لا توجد بلاغات مطابقة</p>
                      <p className="mt-1 text-sm text-slate-600">جرّب تعديل الفلاتر أو كلمة البحث.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer transition-colors hover:bg-[#003366]/20"
                      onClick={() => openDetail(row.id)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') openDetail(row.id) }}
                      aria-label={`عرض تفاصيل بلاغ ${row.plateNumber}`}
                    >
                      <TableCell className="p-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700" dir="ltr">
                          {shortRef(row.id)}
                          {loadingId === row.id && (
                            <span className="ml-1.5 size-2.5 rounded-full animate-pulse bg-[#003366]" aria-hidden="true" />
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="p-4"><span className="font-mono font-bold text-slate-900" dir="ltr">{row.plateNumber}</span></TableCell>
                      <TableCell className="p-4 text-sm text-slate-600">{VEHICLE_CLASS_LABELS[row.vehicleClass]}</TableCell>
                      <TableCell className="p-4 font-medium text-slate-900">{row.reporterName}</TableCell>
                      <TableCell className="p-4 whitespace-nowrap text-sm text-slate-600">{formatDateTime(row.createdAt)}</TableCell>
                      <TableCell className="p-4">
                        <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                          <span className={`size-1.5 rounded-full ${row.mediaCount === 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          {row.mediaCount} ملفات
                        </span>
                      </TableCell>
                      <TableCell className="p-4"><StatusBadge status={row.status} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <IncidentDrawer incident={selected} onClose={close} />
    </>
  )
}
