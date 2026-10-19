import { Car } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { prisma } from '@/lib/prisma'

export default async function AdminVehiclesPage() {
  const [vehicles, totalVehicles] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: { plateNumber: 'asc' },
      take: 100,
      select: { id: true, plateNumber: true, isActive: true, createdAt: true },
    }),
    prisma.vehicle.count(),
  ])

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">المركبات</h2>
          <p className="mt-1 text-sm text-slate-600">عرض أول 100 مركبة مسجلة في الأسطول.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-sm">إجمالي المركبات: {totalVehicles}</Badge>
      </div>
      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="size-5 text-[#003366]" aria-hidden="true" />
            سجل الأسطول
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم اللوحة</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-slate-500">لا توجد مركبات مسجلة.</TableCell></TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell dir="ltr" className="font-mono font-semibold">{vehicle.plateNumber}</TableCell>
                    <TableCell className="text-sm text-slate-600">{vehicle.plateNumber.startsWith('61') ? 'نقل / شاحنة (61)' : 'سياحية خاصة (12)'}</TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeZone: 'Asia/Damascus' }).format(vehicle.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={vehicle.isActive ? 'border-green-200 bg-green-50 text-green-900' : 'border-slate-200 bg-slate-100 text-slate-600'}
                      >
                        {vehicle.isActive ? 'نشطة' : 'غير نشطة'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
