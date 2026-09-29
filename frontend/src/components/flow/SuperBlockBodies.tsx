import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle,
  Activity,
  Cpu,
} from 'lucide-react'
import { Button, VStack } from '@astryxdesign/core'
import useAppStore from '../../store/useAppStore'
import { trackShapes, parseShapeString, formatShape, type TensorShape } from '../../utils/shapeTracker'
import type { PipelineNode } from '../../types/catalog'
import type { SuperBlockBodyProps } from './superBlockRegistry'

const CANDIDATE_LAYERS = [
  { type: 'conv2d_layer', label: 'Conv2D', desc: 'Convolution spatiale 2D' },
  { type: 'relu_layer', label: 'ReLU', desc: 'Activation max(0, x)' },
  { type: 'maxpool2d_layer', label: 'MaxPool2D', desc: 'Sous-échantillonnage par max' },
  { type: 'flatten_layer', label: 'Flatten', desc: 'Aplatit en vecteur 1D' },
  { type: 'linear_layer', label: 'Linear', desc: 'Couche dense (Wx + b)' },
  { type: 'dropout', label: 'Dropout', desc: 'Désactivation aléatoire' },
  { type: 'batchnorm2d', label: 'BatchNorm2D', desc: 'Normalisation de batch' },
]

let childCounter = 0
function makeChildId(layerType: string): string {
  childCounter += 1
  return `${layerType}_child_${childCounter}`
}

function defaultParamsFor(type: string, lastShape: TensorShape | null): Record<string, unknown> {
  const t = type.replace(/_layer$/, '')
  if (t === 'conv2d') {
    const c = lastShape && lastShape.length === 3 ? lastShape[0] : 3
    return { in_channels: c, out_channels: 32, kernel_size: 3, stride: 1, padding: 0 }
  }
  if (t === 'maxpool2d') return { kernel_size: 2, stride: 2 }
  if (t === 'linear') {
    const inDim = lastShape && lastShape.length > 0 ? lastShape[lastShape.length - 1] : 7200
    return { in_features: inDim, out_features: 10 }
  }
  if (t === 'dropout') return { p: 0.5 }
  if (t === 'batchnorm2d') {
    const c = lastShape && lastShape.length === 3 ? lastShape[0] : 32
    return { num_features: c }
  }
  return {}
}

export function SequentialDrawerBody({ id, data, updateFlowParam }: SuperBlockBodyProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const updateNodeChildren = useAppStore(s => s.updateNodeChildren)

  const inputShapeStr = data.fields?.input_shape ?? '(3, 32, 32)'
  const initialShape = useMemo(() => parseShapeString(inputShapeStr), [inputShapeStr])
  const children = useMemo(() => data.children || [], [data.children])

  const shapeResults = useMemo(
    () => trackShapes(initialShape, children.map(c => ({ id: c.id, type: c.type, params: c.params }))),
    [initialShape, children],
  )

  const handleAddLayer = (layerType: string) => {
    const lastResult = shapeResults[shapeResults.length - 1]
    const lastShape = lastResult ? lastResult.outShape : initialShape
    const newChild: PipelineNode = {
      id: makeChildId(layerType),
      type: layerType,
      params: defaultParamsFor(layerType, lastShape),
    }
    updateNodeChildren(id, [...children, newChild])
    setIsPickerOpen(false)
  }

  const handleMove = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= children.length) return
    const next = [...children]
    const temp = next[index]
    next[index] = next[target]
    next[target] = temp
    updateNodeChildren(id, next)
  }

  const handleRemove = (index: number) => {
    updateNodeChildren(id, children.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] text-text-muted py-1 border-b border-border/40">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="border-none bg-transparent cursor-pointer p-0 text-text-muted hover:text-text flex items-center gap-1 font-semibold"
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>Tiroir de Couches ({children.length})</span>
        </button>
        <div className="flex items-center gap-1">
          <span>In:</span>
          <input
            type="text"
            value={inputShapeStr}
            onChange={e => updateFlowParam(id, 'input_shape', e.target.value)}
            className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-mono w-[85px] text-right"
          />
        </div>
      </div>

      {isExpanded && (
        <>
          {children.length === 0 ? (
            <div className="p-3 text-center border border-dashed border-border rounded-xl text-text-muted text-[11px]">
              Aucune couche empilée.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
              {children.map((child, idx) => {
                const res = shapeResults[idx]
                const outFormatted = res?.outShape ? formatShape(res.outShape) : null
                const label = child.type.replace(/_layer$/, '')

                return (
                  <div
                    key={child.id}
                    className="p-2 rounded-lg bg-surface1 border border-border/60 flex flex-col gap-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-text-muted w-3">{idx + 1}.</span>
                        <span className="font-bold text-text truncate">{label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, -1)}
                          className="p-0.5 text-text-muted hover:text-text disabled:opacity-30 cursor-pointer border-none bg-transparent"
                          title="Monter"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === children.length - 1}
                          onClick={() => handleMove(idx, 1)}
                          className="p-0.5 text-text-muted hover:text-text disabled:opacity-30 cursor-pointer border-none bg-transparent"
                          title="Descendre"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
                          className="p-0.5 text-error/80 hover:text-error cursor-pointer border-none bg-transparent ml-1"
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-text-muted">Sortie:</span>
                      {outFormatted ? (
                        <span className="font-mono px-1.5 py-0.2 rounded bg-accent/15 text-accent font-semibold">
                          [{outFormatted}]
                        </span>
                      ) : (
                        <span className="text-text-muted font-mono">[?]</span>
                      )}
                    </div>

                    {res?.warning && (
                      <div className="flex items-center gap-1 text-[10px] text-error font-medium bg-error/10 p-1 rounded">
                        <AlertTriangle size={11} className="shrink-0" />
                        <span className="truncate" title={res.warning}>{res.warning}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="relative pt-1">
            <Button
              label="Ajouter une couche"
              icon={<Plus size={14} />}
              variant="secondary"
              size="sm"
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="w-full text-[11px] font-bold py-1 flex items-center justify-center gap-1 rounded-lg"
            />

            {isPickerOpen && (
              <div
                className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface2 border border-border rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 max-h-[220px] overflow-y-auto"
                style={{ backgroundColor: 'var(--color-surface2, #1e293b)' }}
              >
                <div className="text-[10px] font-bold text-text-muted px-2 py-0.5 uppercase tracking-wider">
                  Couches Disponibles
                </div>
                {CANDIDATE_LAYERS.map(c => (
                  <button
                    key={c.type}
                    type="button"
                    onClick={() => handleAddLayer(c.type)}
                    className="flex flex-col text-left px-2 py-1.5 rounded-lg hover:bg-surface3 border-none bg-transparent cursor-pointer text-text transition-colors"
                  >
                    <span className="font-bold text-[11px] text-text-light">{c.label}</span>
                    <span className="text-[10px] text-text-muted">{c.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function TrainerBody({ id, data, updateFlowParam, inputFed, outputFed }: SuperBlockBodyProps) {
  const results = useAppStore(s => s.results)
  const epochs = data.fields?.epochs ?? '5'
  const optimizer = data.fields?.optimizer ?? 'adam'
  const lr = data.fields?.learning_rate ?? '0.001'
  const lossFn = data.fields?.loss_fn ?? 'cross_entropy'
  const myResult = results.find(r => r.block_name === 'deep_trainer' || r.block_id === id)

  const slots = [
    { id: 'in_1', label: 'Train Data', color: '#A855F7', fed: inputFed['in_1'] },
    { id: 'in_2', label: 'Modèle', color: '#F97316', fed: inputFed['in_2'] },
    { id: 'in_3', label: 'Val (opt)', color: '#A855F7', fed: inputFed['in_3'] },
    { id: 'out_1', label: 'Trained Model', color: '#F97316', fed: outputFed['out_1'] },
  ]

  return (
    <VStack gap={2}>
      <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-surface1 p-2 rounded-xl border border-border/40">
        {slots.map(s => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{
                backgroundColor: s.color,
                boxShadow: s.fed ? `0 0 6px ${s.color}` : 'none',
              }}
            />
            <span className={s.fed ? 'text-text font-semibold' : 'text-text-muted'}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Époques:</span>
        <input
          type="number"
          min={1}
          max={100}
          value={epochs}
          onChange={e => updateFlowParam(id, 'epochs', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-mono w-[65px] text-right"
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Optimiseur:</span>
        <select
          value={optimizer}
          onChange={e => updateFlowParam(id, 'optimizer', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-body w-[90px]"
        >
          <option value="adam">Adam</option>
          <option value="sgd">SGD</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Learning Rate:</span>
        <input
          type="text"
          value={lr}
          onChange={e => updateFlowParam(id, 'learning_rate', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-mono w-[65px] text-right"
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Loss Function:</span>
        <select
          value={lossFn}
          onChange={e => updateFlowParam(id, 'loss_fn', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-body w-[110px]"
        >
          <option value="cross_entropy">CrossEntropy</option>
          <option value="mse">MSE</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-[10px] p-1.5 rounded-lg bg-surface1 border border-border/50">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-accent" />
          <span className="text-text-muted">Statut:</span>
        </div>
        {myResult ? (
          <span className="text-success font-semibold flex items-center gap-1">
            <Cpu size={11} /> Entraîné
          </span>
        ) : (
          <span className="text-text-muted">Prêt</span>
        )}
      </div>
    </VStack>
  )
}

export function DataPipelineBody({ id, data, updateFlowParam }: SuperBlockBodyProps) {
  const dataset = data.fields?.dataset ?? 'cifar10'
  const batchSize = data.fields?.batch_size ?? '64'
  const trainRatio = data.fields?.train_ratio ?? '0.8'
  const normalize = data.fields?.normalize ?? 'true'

  return (
    <VStack gap={2}>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Dataset:</span>
        <select
          value={dataset}
          onChange={e => updateFlowParam(id, 'dataset', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-body w-[110px]"
        >
          <option value="cifar10">CIFAR-10</option>
          <option value="mnist">MNIST</option>
          <option value="fashion_mnist">Fashion-MNIST</option>
          <option value="custom">Personnalisé</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Batch Size:</span>
        <input
          type="number"
          min={1}
          max={512}
          value={batchSize}
          onChange={e => updateFlowParam(id, 'batch_size', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-mono w-[65px] text-right"
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Train / Val Ratio:</span>
        <input
          type="number"
          step={0.05}
          min={0.1}
          max={0.95}
          value={trainRatio}
          onChange={e => updateFlowParam(id, 'train_ratio', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-mono w-[65px] text-right"
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Normaliser:</span>
        <input
          type="checkbox"
          checked={normalize === 'true'}
          onChange={e => updateFlowParam(id, 'normalize', e.target.checked ? 'true' : 'false')}
          className="cursor-pointer"
        />
      </div>
    </VStack>
  )
}

export function MLPipelineBody({ id, data, updateFlowParam }: SuperBlockBodyProps) {
  const scaler = data.fields?.scaler ?? 'standard'
  const pcaComponents = data.fields?.pca_components ?? '0'
  const estimator = data.fields?.estimator ?? 'logistic_regression'
  const targetCol = data.fields?.target_column ?? 'target'

  return (
    <VStack gap={2}>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Scaler:</span>
        <select
          value={scaler}
          onChange={e => updateFlowParam(id, 'scaler', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-body w-[100px]"
        >
          <option value="standard">StandardScaler</option>
          <option value="minmax">MinMaxScaler</option>
          <option value="none">Aucun</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">PCA (dims):</span>
        <input
          type="number"
          min={0}
          max={50}
          value={pcaComponents}
          onChange={e => updateFlowParam(id, 'pca_components', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-mono w-[65px] text-right"
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Modèle:</span>
        <select
          value={estimator}
          onChange={e => updateFlowParam(id, 'estimator', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-body w-[125px]"
        >
          <option value="logistic_regression">LogisticRegression</option>
          <option value="random_forest">RandomForest</option>
          <option value="linear_regression">LinearRegression</option>
          <option value="kmeans">KMeans</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-text-muted">Colonne Cible:</span>
        <input
          type="text"
          value={targetCol}
          onChange={e => updateFlowParam(id, 'target_column', e.target.value)}
          className="bg-surface1! border border-border! rounded px-1.5 py-0.5 text-[11px] text-text font-mono w-[80px] text-right"
        />
      </div>
    </VStack>
  )
}
