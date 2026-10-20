import { redirect } from 'next/navigation'
import { LockKeyhole, ShieldCheck, UsersRound } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserCreateForm } from '@/components/admin/user-create-form'

export const dynamic = 'force-dynamic'

const ROLE_LABELS = { ADMIN: 'مدير النظام', AGENT: 'موظف حوادث' } as const

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const currentUser = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <section dir="rtl" className="mx-auto max-w-3xl rounded-[28px] border border-amber-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
          <LockKeyhole className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-5 text-sm font-extrabold text-amber-900">صفحة مقيّدة</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-950">إدارة المستخدمين متاحة لمدير النظام فقط</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-700">
          لا تملك صلاحية إنشاء حسابات أو منح أدوار إدارية. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مدير النظام.
        </p>
      </section>
    )
  }

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[1500px] space-y-6 pb-12">
      <header className="overflow-hidden rounded-[28px] bg-[linear-gradient(130deg,#0b3a7a_0%,#003366_55%,#04172f_100%)] p-6 text-white shadow-float sm:p-9">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
            <UsersRound className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-blue-100">إدارة الوصول المؤسسي</p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">حسابات الموظفين</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-blue-50">
              إنشاء حسابات آمنة وتحديد مستوى الصلاحية المناسب لكل عضو في فريق معالجة الحوادث.
            </p>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#003366]/10 text-[#003366]">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-extrabold text-slate-950">إضافة موظف جديد</h2>
            <p className="mt-0.5 text-sm font-medium text-slate-700">تُشفّر كلمة المرور قبل حفظ الحساب.</p>
          </div>
        </header>
        <div className="p-5 sm:p-7">
          <UserCreateForm />
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-7">
          <div>
            <h2 className="font-extrabold text-slate-950">المستخدمون المسجلون</h2>
            <p className="mt-1 text-sm font-medium text-slate-700">{users.length} حساب</p>
          </div>
        </header>
        {users.length === 0 ? (
          <p className="p-8 text-center font-semibold text-slate-700">لا توجد حسابات مسجلة.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">{user.name}</p>
                  <p dir="ltr" className="mt-1 truncate text-start text-sm font-medium text-slate-700">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={user.role === 'ADMIN' ? 'rounded-full bg-[#003366]/10 px-3 py-1.5 text-xs font-bold text-[#003366]' : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800'}>
                    {ROLE_LABELS[user.role]}
                  </span>
                  <time className="hidden text-xs font-medium text-slate-700 sm:block" dateTime={user.createdAt.toISOString()}>
                    {user.createdAt.toLocaleDateString('ar-SY', { dateStyle: 'medium', timeZone: 'Asia/Damascus' })}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
