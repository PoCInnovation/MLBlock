import { useNavigate } from '@tanstack/react-router'
import useAppStore from '../../store/useAppStore'
import { CloudOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './dialog'

export default function EditorUnavailableModal() {
  const navigate = useNavigate()
  const message = useAppStore(s => s.catalogErrorMessage)

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-md bg-card border-border p-6 flex flex-col gap-4 text-center items-center" showCloseButton={false}>
        <div className="text-4xl text-warning flex justify-center pt-2">
          <CloudOff className="size-10" />
        </div>
        <DialogHeader className="gap-1 items-center">
          <DialogTitle className="text-xl font-heading font-bold text-foreground">
            Éditeur non disponible
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center">
            {message ?? 'Impossible de joindre le serveur. Vérifie que le backend est lancé et réessaie.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="w-full justify-center mt-2">
          <Button
            onClick={() => navigate({ to: '/' })}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto font-bold"
          >
            <ArrowLeft className="size-4 mr-2" /> Retour à l'accueil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
