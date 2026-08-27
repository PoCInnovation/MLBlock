import { useEffect, useRef } from 'react'
import { useToast } from '@astryxdesign/core'
import useAppStore from '../../store/useAppStore'

export default function Toast() {
  const showToast = useToast()
  const toast = useAppStore(s => s.toast)
  const clearToast = useAppStore(s => s.clearToast)
  const jobStatus = useAppStore(s => s.jobStatus)
  const prevStatus = useRef<string | null>(null)

  // Bridge old store toast (kind/message) to Astryx Toast
  useEffect(() => {
    if (!toast) return
    showToast({ body: toast.message, type: toast.kind === 'error' ? 'error' : 'info', uniqueID: 'app-toast' })
    const t = setTimeout(clearToast, 5000)
    return () => clearTimeout(t)
  }, [toast, showToast, clearToast])

  // Job status toasts: one per transition, not per line
  useEffect(() => {
    if (!jobStatus || jobStatus === prevStatus.current) return
    prevStatus.current = jobStatus
    if (jobStatus === 'queued') showToast({ body: 'Pipeline en file d’attente…', type: 'info', uniqueID: 'job-status' })
    else if (jobStatus === 'running') showToast({ body: 'Pipeline en cours…', type: 'info', uniqueID: 'job-status' })
    else if (jobStatus === 'done') showToast({ body: 'Pipeline terminée', type: 'info', uniqueID: 'job-status' })
    else if (jobStatus === 'error') showToast({ body: 'Échec — voir Journal', type: 'error', uniqueID: 'job-status', isAutoHide: false })
  }, [jobStatus, showToast])

  return null
}
