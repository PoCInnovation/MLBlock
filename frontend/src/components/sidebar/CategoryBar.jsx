import useAppStore from '../../store/useAppStore'
import { categories } from '../../mockdata/categories'
import CategoryIcon from './CategoryIcon'

export default function CategoryBar() {
  const selected = useAppStore(s => s.category)
  const setCategory = useAppStore(s => s.setCategory)

  return (
    <div style={{
      width: 92, flexShrink: 0, background: '#1c1714',
      borderRight: '1px solid rgba(255,255,255,.06)',
      padding: '12px 8px', display: 'flex', flexDirection: 'column',
      gap: 6, overflowY: 'auto',
    }}>
      {categories.map(cat => (
        <CategoryIcon
          key={cat.id}
          cat={{ ...cat, onClick: () => setCategory(cat.id) }}
          selected={selected === cat.id}
        />
      ))}
    </div>
  )
}
