'use server'

import { getSession } from '@/lib/auth'
import { updateIncidentStatus } from '@/lib/admin-queries'

export async function updateStatusAction(id: string, status: string): Promise<boolean> {
  const session = await getSession()
  if (!session) return false
  return updateIncidentStatus(id, status)
}
