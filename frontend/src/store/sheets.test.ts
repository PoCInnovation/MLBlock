import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../api/client', () => ({
  createPipeline: vi.fn(),
  updatePipeline: vi.fn(),
}))

import useAppStore from './useAppStore'

const initialState = useAppStore.getState()

beforeEach(() => {
  useAppStore.setState(initialState)
})

describe('sheets config/compat', () => {
  it('ouvre la sheet config sur un superblock cible', () => {
    useAppStore.getState().setConfigTarget('tabular_data_pipeline')
    useAppStore.getState().setActiveSheet('config')
    expect(useAppStore.getState().configTarget).toBe('tabular_data_pipeline')
    expect(useAppStore.getState().activeSheet).toBe('config')
  })

  it('ouvre la sheet compat sur un port de sortie', () => {
    useAppStore.getState().setCompatSource({ nodeId: 'n1', port: 'out_1' })
    useAppStore.getState().setActiveSheet('compat')
    expect(useAppStore.getState().compatSource).toEqual({ nodeId: 'n1', port: 'out_1' })
    expect(useAppStore.getState().activeSheet).toBe('compat')
  })
})
