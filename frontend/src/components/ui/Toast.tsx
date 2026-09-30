import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import useAppStore from '../../store/useAppStore'

export default function Toast() {
  const appToast = useAppStore(s => s.toast)
  const clearToast = useAppStore(s => s.clearToast)
  const jobStatus = useAppStore(s => s.jobStatus)
  const prevStatus = useRef<string | null>(null)

  useEffect(() => {
    if (!appToast) return
    if (appToast.kind === 'error') {
      toast.error(appToast.message, { id: 'app-toast' })
    } else {
      toast.info(appToast.message, { id: 'app-toast' })
    }
    const t = setTimeout(clearToast, 5000)
    return () => clearTimeout(t)
  }, [appToast, clearToast])

  useEffect(() => {
    if (!jobStatus || jobStatus === prevStatus.current) return
    prevStatus.current = jobStatus
    if (jobStatus === 'queued') toast.info('Pipeline en file d’attente…', { id: 'job-status' })
    else if (jobStatus === 'running') toast.info('Pipeline en cours…', { id: 'job-status' })
    else if (jobStatus === 'done') toast.success('Pipeline terminée', { id: 'job-status' })
    else if (jobStatus === 'error') toast.error('Échec — voir Journal', { id: 'job-status', duration: Infinity })
  }, [jobStatus])

  return null
}
