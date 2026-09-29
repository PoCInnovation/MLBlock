import type { ComponentType } from 'react'
import type { PipelineNode } from '../../types/catalog'
import {
  SequentialDrawerBody,
  TrainerBody,
  DataPipelineBody,
  MLPipelineBody,
} from './SuperBlockBodies'

export type SlotDef = {
  id: string
  label: string
  dtype: string
  color: string
}

export type SuperBlockNodeData = {
  type: string
  label?: string
  fields?: Record<string, string>
  children?: PipelineNode[]
  stage?: number
}

export type SuperBlockBodyProps = {
  id: string
  data: SuperBlockNodeData
  updateFlowParam: (nodeId: string, k: string, v: string) => void
  inputFed: Record<string, boolean>
  outputFed: Record<string, boolean>
}

export type SuperBlockDefinition = {
  stage: number
  title: string
  subtitle?: string
  inputs: SlotDef[]
  outputs: SlotDef[]
  Body: ComponentType<SuperBlockBodyProps>
}

export const SUPER_BLOCK_REGISTRY: Record<string, SuperBlockDefinition> = {
  sequential_container: {
    stage: 2,
    title: 'SequentialModel',
    subtitle: 'Architecture séquentielle de réseau de neurones',
    inputs: [{ id: 'in_1', label: 'Tensor', dtype: 'Tensor', color: '#6366F1' }],
    outputs: [{ id: 'out_1', label: 'Model', dtype: 'torch.nn.Module', color: '#F97316' }],
    Body: SequentialDrawerBody,
  },
  deep_trainer: {
    stage: 3,
    title: 'DeepTrainer',
    subtitle: "Orchestrateur universel d'entraînement multi-slots",
    inputs: [
      { id: 'in_1', label: 'Train Data', dtype: 'DataLoader', color: '#A855F7' },
      { id: 'in_2', label: 'Modèle', dtype: 'nn.Module', color: '#F97316' },
      { id: 'in_3', label: 'Val Data (opt)', dtype: 'DataLoader', color: '#A855F7' },
    ],
    outputs: [
      { id: 'out_1', label: 'Trained Model', dtype: 'nn.Module', color: '#F97316' },
      { id: 'out_2', label: 'Métriques', dtype: 'dict', color: '#10B981' },
    ],
    Body: TrainerBody,
  },
  data_pipeline: {
    stage: 0,
    title: 'DataPipeline',
    subtitle: 'Ingestion & préparation multi-batches',
    inputs: [],
    outputs: [
      { id: 'out_1', label: 'Train Loader', dtype: 'DataLoader', color: '#A855F7' },
      { id: 'out_2', label: 'Test Loader', dtype: 'DataLoader', color: '#A855F7' },
    ],
    Body: DataPipelineBody,
  },
  ml_pipeline: {
    stage: 2,
    title: 'MLPipeline',
    subtitle: 'Pipeline Scikit-Learn Tabulaire',
    inputs: [{ id: 'in_1', label: 'Data', dtype: 'pd.DataFrame', color: '#3B82F6' }],
    outputs: [
      { id: 'out_1', label: 'Model Pipeline', dtype: 'Model', color: '#10B981' },
      { id: 'out_2', label: 'Predictions', dtype: 'ndarray', color: '#10B981' },
    ],
    Body: MLPipelineBody,
  },
}

export function isSuperBlock(type: string): boolean {
  return type in SUPER_BLOCK_REGISTRY
}
