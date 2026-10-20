export default function IncidentLoading() {
  return (
    <div className="mx-auto w-full max-w-[1600px] animate-pulse space-y-6 pb-16" dir="rtl" aria-label="جارٍ تحميل تفاصيل البلاغ">
      <div className="h-64 rounded-[24px] bg-slate-200" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <div className="h-48 rounded-[20px] bg-white shadow-sm ring-1 ring-slate-100" />
          <div className="h-64 rounded-[20px] bg-white shadow-sm ring-1 ring-slate-100" />
          <div className="h-96 rounded-[20px] bg-white shadow-sm ring-1 ring-slate-100" />
        </div>
        <div className="h-80 rounded-[20px] bg-white shadow-sm ring-1 ring-slate-100" />
      </div>
    </div>
  )
}
