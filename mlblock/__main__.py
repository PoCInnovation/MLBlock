import json
import sys

from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.models.registry import BlockRegistry
from mlblock.core.validator import PipelineValidator
from mlblock.core.resolver import DAGResolver
from mlblock.core.generator import CodeGenerator
from mlblock.core.executor import PipelineExecutor


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "pipeline.json"
    with open(path) as f:
        raw = json.load(f)

    registry = BlockRegistry(BLOCK_REGISTRY)
    validator = PipelineValidator()
    pipeline = validator.validate(raw, registry)

    resolver = DAGResolver()
    ordered_nodes = resolver.resolve(pipeline)

    generator = CodeGenerator(registry)
    code = generator.generate(ordered_nodes, pipeline.edges)

    output_path = "main.py"
    with open(output_path, "w") as f:
        f.write(code)
    print(f"✅ Pipeline généré → {output_path}")

    executor = PipelineExecutor()
    result = executor.run(output_path)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)


if __name__ == "__main__":
    main()
