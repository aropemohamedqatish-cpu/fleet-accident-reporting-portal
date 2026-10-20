'use client'

import Link from 'next/link'
import { ArrowLeft, FileSearch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from './status-badge'
import { formatDateTime, shortRef, type IncidentRow } from '@/lib/admin-claims'

export function ClaimsTable({ rows, total }: { rows: IncidentRow[]; total: number }) {
  return (
    <Card className="overflow-hidden border-0 bg-white rounded-[20px] border border-slate-100 shadow-sm">
        <CardHeader className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <CardTitle className="text-lg font-bold text-slate-950">سجل البلاغات</CardTitle>
            <p className="mt-1 text-sm text-slate-600">اختر أي بلاغ لعرض صفحته الكاملة: التفاصيل، الصور، والفيديو.</p>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-slate-600 border-slate-200 bg-slate-50">
            {rows.length} من {total}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-100">
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">المرجع</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">رقم اللوحة</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">اسم السائق</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">وقت التسجيل</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">المرفقات</TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-slate-600">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-14 text-center">
                      <FileSearch className="mx-auto mb-3 size-10 text-slate-400" aria-hidden="true" />
                      <p className="font-semibold text-slate-900">لا توجد بلاغات مطابقة</p>
                      <p className="mt-1 text-sm text-slate-600">جرّب تعديل الفلاتر أو كلمة البحث.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} className="transition-colors hover:bg-[#003366]/5">
                      <TableCell className="p-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700" dir="ltr">
                          {shortRef(row.id)}
                        </span>
                      </TableCell>
                      <TableCell className="p-4"><span className="font-mono font-bold text-slate-900" dir="ltr">{row.plateNumber}</span></TableCell>
                      <TableCell className="p-4 font-medium text-slate-900">{row.reporterName}</TableCell>
                      <TableCell className="p-4 whitespace-nowrap text-sm text-slate-600">{formatDateTime(row.createdAt)}</TableCell>
                      <TableCell className="p-4">
                        <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                          <span className={`size-1.5 rounded-full ${row.mediaCount === 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          {row.mediaCount} ملفات
                        </span>
                      </TableCell>
                      <TableCell className="p-4">
                        <span className="inline-flex items-center gap-2">
                          <StatusBadge status={row.status} />
                          <Link
                            href={`/admin/incidents/${row.id}`}
                            aria-label={`عرض تفاصيل بلاغ ${row.plateNumber}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-[#003366]/20 bg-[#003366]/5 text-[#003366] transition hover:bg-[#003366] hover:text-white"
                          >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                          </Link>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
  )
}
