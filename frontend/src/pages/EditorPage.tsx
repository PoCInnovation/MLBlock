import { useBlockRunner } from '../hooks/useBlockRunner'
import EditorHeader from '../components/editor/EditorHeader'
import EditorLayout from '../components/editor/EditorLayout'

export default function EditorPage() {
  const { onRun, onStop, onClear } = useBlockRunner()

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#171311', color: '#f0e9e3', overflow: 'hidden' }}>
      <EditorHeader onRun={onRun} onStop={onStop} onClear={onClear} />
      <EditorLayout />
    </div>
  )
}
