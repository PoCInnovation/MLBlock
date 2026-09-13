import type { BlockDefMap } from '../types/catalog'
import {
  familyOf,
  splitUnion,
  buildConversionGraph,
  classifyEdge,
  converterFor,
  type Verdict,
} from './typeCheck'
import {
  Stage,
  STAGE_OF_BLOCK_OVERRIDES,
  STAGE_OF_CATEGORY,
  STAGE_OF_FAMILY,
  stageOfBlock,
  stageOfCategory,
  stageOfFamily,
} from './stages'

const QUICK_MAP: Record<string, string> = {
  'df->tensor': 'df_to_tensor',
  'ndarray->tensor': 'to_tensor',
  'image->tensor': 'to_tensor',
}

export class TypeSystem {
  private conversionGraph: Map<string, Set<string>> | null = null

  familyOf(dtype: string): string {
    return familyOf(dtype)
  }

  // Alias for Python parity
  family_of(dtype: string): string {
    return this.familyOf(dtype)
  }

  buildConversionGraph(blocks: BlockDefMap): Map<string, Set<string>> {
    const graph = buildConversionGraph(blocks)
    this.conversionGraph = graph
    return graph
  }

  // Alias for Python parity
  build_conversion_graph(blocks: BlockDefMap): Map<string, Set<string>> {
    return this.buildConversionGraph(blocks)
  }

  classify(srcDtype: string, tgtDtype: string, graph?: Map<string, Set<string>>): Verdict {
    const g = graph ?? this.conversionGraph ?? new Map<string, Set<string>>()
    return classifyEdge(srcDtype, tgtDtype, g)
  }

  stageOf(blockOrFamily: string, category?: string): Stage {
    const key = blockOrFamily.trim()
    if (STAGE_OF_BLOCK_OVERRIDES[key] !== undefined) {
      return STAGE_OF_BLOCK_OVERRIDES[key]
    }

    const catKey = key.split('-')[0].trim().toLowerCase()
    if (STAGE_OF_CATEGORY[catKey] !== undefined) {
      return stageOfCategory(key)
    }

    const famKey = key.toLowerCase()
    if (STAGE_OF_FAMILY[famKey] !== undefined) {
      return stageOfFamily(famKey)
    }

    return stageOfBlock(key, category)
  }

  // Alias for Python parity
  stage_of(blockOrFamily: string, category?: string): Stage {
    return this.stageOf(blockOrFamily, category)
  }

  findConverter(srcDtype: string, tgtDtype: string, blocks?: BlockDefMap): string | null {
    const srcFam = this.familyOf(srcDtype)
    const tgtFam = this.familyOf(tgtDtype)

    const mapped = QUICK_MAP[`${srcFam}->${tgtFam}`]
    if (mapped) {
      return mapped
    }

    if (!blocks) {
      return null
    }

    // Try standard converterFor first
    const direct = converterFor(srcDtype, tgtDtype, blocks)
    if (direct) {
      return direct
    }

    // Iterate over transforms blocks searching for input and output family match
    for (const [name, def] of Object.entries(blocks)) {
      if (def.cat !== 'transforms' && def.cat !== 'transformations') continue
      const inFamilies = new Set(def.inputs.flatMap(p => splitUnion(p.dtype)).map(d => this.familyOf(d)))
      const outFamilies = new Set(def.outputs.flatMap(p => splitUnion(p.dtype)).map(d => this.familyOf(d)))
      if (inFamilies.has(srcFam) && outFamilies.has(tgtFam)) {
        return name
      }
    }

    return null
  }

  // Alias for Python parity
  find_converter(srcDtype: string, tgtDtype: string, blocks?: BlockDefMap): string | null {
    return this.findConverter(srcDtype, tgtDtype, blocks)
  }

  canConnect(
    srcDtype: string,
    tgtDtype: string,
    graph?: Map<string, Set<string>>,
    srcBlock?: string,
    tgtBlock?: string,
    blocks?: BlockDefMap,
  ): [Verdict, string | null] {
    const verdict = this.classify(srcDtype, tgtDtype, graph)
    if (verdict === 'compatible') {
      return ['compatible', null]
    }

    const conv = this.findConverter(srcDtype, tgtDtype, blocks)
    if (verdict === 'convertible') {
      if (conv) {
        if (srcBlock && tgtBlock) {
          return ['convertible', `Astuce : insérez un bloc ${conv} entre '${srcBlock}' et '${tgtBlock}'`]
        }
        return ['convertible', `Astuce : insérez un bloc ${conv}`]
      }
      return ['convertible', `Type convertible de ${srcDtype} vers ${tgtDtype}`]
    }

    // Incompatible
    if (conv) {
      return ['incompatible', `Type mismatch: ${srcDtype} -> ${tgtDtype}. Astuce : insérez un bloc ${conv}`]
    }
    return ['incompatible', `Type mismatch: ${srcDtype} -> ${tgtDtype}. Aucune conversion possible`]
  }

  // Alias for Python parity
  can_connect(
    srcDtype: string,
    tgtDtype: string,
    graph?: Map<string, Set<string>>,
    srcBlock?: string,
    tgtBlock?: string,
    blocks?: BlockDefMap,
  ): [Verdict, string | null] {
    return this.canConnect(srcDtype, tgtDtype, graph, srcBlock, tgtBlock, blocks)
  }
}

export const typeSystem = new TypeSystem()
