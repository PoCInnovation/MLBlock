from mlblock.models.pipeline import PipelineDef
from mlblock.models.registry import BlockRegistry


class PipelineValidator:
    def validate(self, raw: dict, registry: BlockRegistry) -> PipelineDef:
        return PipelineDef.model_validate(raw, context={"registry": registry})
