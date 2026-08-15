## 1. Schemas

- [x] 1.1 `frontend/src/schemas/api.ts`: add zod schemas for `PipelineDetail`, `PipelineSummary`, `PipelinePage`, `PipelineCreate`, `Job`, `JobOutput`, `BuildResponse`, `GenerateResponse` (prefer `z.infer`-compatible shapes matching `types/catalog.ts`)
- [x] 1.2 Keep TS types and schemas in parity: derive types from schemas where practical, or align hand-written interfaces with schema shapes

## 2. Boundary validation

- [x] 2.1 `frontend/src/api/client.ts`: apply `.parse()` to every server response (fetchCatalog, createPipeline, listPipelines, getPipeline, updatePipeline, getJob, getJobOutputs, listPipelineJobs, buildPipeline, generatePipelineCode)
- [x] 2.2 On parse failure, throw a descriptive `Error` naming the endpoint and the zod issues — never return partially validated data

## 3. Verify

- [x] 3.1 `npm run build` passes
- [ ] 3.2 Smoke: open editor + projects page with the backend up; catalog, pipeline list/detail, and job outputs still render
