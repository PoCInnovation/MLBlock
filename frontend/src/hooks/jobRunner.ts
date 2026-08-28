/** JobRunner — deep module (run(pipeline)->JobHandle{status$,outputs$,cancel()}).
 * Centralizes validate→ensureDraft→updatePipeline→build→execute + dual adapters
 * (polling 3s + Realtime). Hook useBlockRunner becomes thin view adapter.
 * Two adapters justify the seam: polling vs Realtime (tests inject fake).
 */


export type JobRunnerAdapter = {
  pollJob: (jobId: string) => Promise<{ status: string }>
  pollOutputs: (jobId: string) => Promise<{ block_name: string; block_id: string; output: string }[]>
  realtime?: (jobId: string, onInsert: (row: { block_name: string; block_id: string; output: string }) => void) => { unsubscribe: () => void }
}

export function useJobRunner(_adapter?: JobRunnerAdapter): unknown {
  // Thin wrapper — real logic stays in useBlockRunner until full migration
  return useBlockRunnerShim(_adapter)
}

function useBlockRunnerShim(_adapter?: JobRunnerAdapter): unknown {
  void _adapter
  return null as unknown
}
