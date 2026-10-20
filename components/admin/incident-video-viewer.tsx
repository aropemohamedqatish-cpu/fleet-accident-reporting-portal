import { Video } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VideoPlayer } from './media-gallery'
import { formatFileSize, type IncidentMedia } from '@/lib/admin-claims'

export function IncidentVideoViewer({ videos }: { videos: IncidentMedia[] }) {
  return (
    <Card className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#003366]/10 text-[#003366]">
            <Video className="size-5" aria-hidden="true" />
          </span>
          فيديو الحادث
        </CardTitle>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 tabular-nums">{videos.length}</span>
      </CardHeader>
      <CardContent className="px-6 py-5">
        {videos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            لا يوجد فيديو مرفق لهذا البلاغ.
          </p>
        ) : (
          <div className="grid gap-4">
            {videos.map((v) => (
              <figure key={v.id} className="overflow-hidden rounded-2xl bg-[#0b1120]">
                <VideoPlayer src={v.fileUrl} fileSize={v.fileSize} />
                <figcaption className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-300">
                  <span dir="ltr" className="font-mono">{v.fileType}</span>
                  <span>{formatFileSize(v.fileSize)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
