import { useNavigate } from '@tanstack/react-router'
import useAppStore from '../../store/useAppStore'
import { CloudOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditorUnavailableModal() {
  const navigate = useNavigate()
  const message = useAppStore(s => s.catalogErrorMessage)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-surface2 border border-white/10 rounded-2xl p-10 text-center w-11/12" style={{ maxWidth: 400 }}>
        <div className="text-4xl mb-4 text-warning flex justify-center"><CloudOff className="size-10" /></div>
        <div className="font-heading font-bold text-xl mb-2.5 text-text">
          Éditeur non disponible
        </div>
        <div className="text-sm text-text-muted mb-7 leading-relaxed">
          {message ?? 'Impossible de joindre le serveur. Vérifie que le backend est lancé et réessaie.'}
        </div>
        <Button
          onClick={() => navigate({ to: '/' })}
          variant="outline"
          size="lg"
          className="bg-white/10 text-text border-white/15 hover:bg-white/20"
        >
          <ArrowLeft className="size-4 mr-2" /> Retour
        </Button>
      </div>
    </div>
  )
}
