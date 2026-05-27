import re

from mlblock.core.block import BlockRegistry
from mlblock.models.block_spec import BlockSpec


class CodeGenerator:
    def __init__(self, graph):
        self.graph = graph

    def generate(self) -> str:
        order = self.graph.topological_sort()

        inbound_index: dict[str, list[tuple[str, str, str]]] = {}
        for e in self.graph.edges:
            inbound_index.setdefault(e.target, []).append(
                (e.source, e.source_port, e.target_port)
            )

        imports: set[str] = set()
        body_lines: list[str] = []

        for node_id in order:
            node = self.graph.nodes[node_id]
            meta = node.block
            if meta is None:
                continue
            spec = meta.spec
            code = spec.template
            if not code:
                continue

            code = self._escape_braces(code)
            code = self._resolve_cond_params(code, node)
            code = self._resolve_inputs(code, node, inbound_index)
            code = self._resolve_outputs(code, node)
            code = self._resolve_params(code, node, spec)
            code = self._resolve_node_id(code, node)
            code = self._unescape_braces(code)
            code = self._resolve_special_placeholders(code, node, spec)
            code = self._extract_imports(code, imports)
            body_lines.append(code)

        return self._assemble(imports, body_lines)

    def _escape_braces(self, code: str) -> str:
        code = code.replace("{{", "\x00")
        code = code.replace("}}", "\x01")
        return code

    def _unescape_braces(self, code: str) -> str:
        code = code.replace("\x00", "{")
        code = code.replace("\x01", "}")
        return code

    def _resolve_cond_params(self, code: str, node) -> str:
        cond_pattern = re.compile(
            r"\{'([^']*)'\s*\+\s*str\(params\.(\w+)\)\s+if\s+params\.(\w+)\s+is\s+not\s+None\s+else\s+'([^']*)'\}"
        )
        while True:
            m = cond_pattern.search(code)
            if not m:
                break
            prefix, param_name, _, empty = m.groups()
            value = node.params.get(param_name)
            if value is not None:
                code = code[: m.start()] + f"'{prefix}{value}'" + code[m.end():]
            else:
                code = code[: m.start()] + code[m.end():]
        return code

    def _resolve_inputs(
        self, code: str, node,
        inbound_index: dict[str, list[tuple[str, str, str]]],
    ) -> str:
        edges_in = inbound_index.get(node.id, [])
        for source_id, source_port, target_port in edges_in:
            var_name = self._resolve_var(source_id, source_port)
            pattern = r"\{input\.%s\}" % re.escape(target_port)
            code = re.sub(pattern, var_name, code)
        code = re.sub(r"\{input\.(\w+)\}", r"None  # port '\1' non connecte", code)
        return code

    def _resolve_outputs(self, code: str, node) -> str:
        code = re.sub(
            r"\{output\.(\w+)\}",
            lambda m: self._resolve_var(node.id, m.group(1)),
            code,
        )
        return code

    def _resolve_params(self, code: str, node, spec: BlockSpec) -> str:
        for param_name, p_spec in spec.params.items():
            value = node.params.get(param_name, p_spec.default)
            serialized = self._serialize_param(value, p_spec.type)
            code = code.replace(f"{{params.{param_name}}}", serialized)
            raw_serialized = self._serialize_param_raw(value, p_spec.type)
            code = code.replace(f"{{raw_params.{param_name}}}", raw_serialized)
        return code

    def _serialize_param_raw(self, value, param_type: str) -> str:
        if value is None:
            return "None"
        if param_type == "str":
            return str(value)
        if param_type == "bool":
            return "True" if value else "False"
        return str(value)

    def _resolve_node_id(self, code: str, node) -> str:
        return code.replace("{node_id}", node.id)

    def _resolve_special_placeholders(self, code: str, node, spec: BlockSpec) -> str:
        if "{metric_expr}" in code:
            method = node.params.get("method", "mse")
            expr = self._metric_expr(method, node)
            code = code.replace("{metric_expr}", expr)
        if "{plot_code}" in code:
            plot = node.params.get("plot", False) or node.params.get("plot_rewards", False)
            if plot:
                plot_code = self._plot_code(node, spec)
                code = code.replace("{plot_code}", plot_code)
            else:
                code = code.replace("{plot_code}", "")
        if "{space_expr}" in code:
            expr = self._space_expr(node)
            code = code.replace("{space_expr}", expr)
        return code

    def _metric_expr(self, method: str, node) -> str:
        nid = node.id
        exprs = {
            "mse": f"mean_squared_error(y_test_{nid}, y_pred_{nid})",
            "rmse": f"math.sqrt(mean_squared_error(y_test_{nid}, y_pred_{nid}))",
            "r2": f"r2_score(y_test_{nid}, y_pred_{nid})",
            "mae": f"mean_absolute_error(y_test_{nid}, y_pred_{nid})",
        }
        return exprs.get(method, exprs["mse"])

    def _plot_code(self, node, spec: BlockSpec) -> str:
        if spec.category == "evaluation":
            nid = node.id
            return (
                f"import matplotlib.pyplot as plt\n"
                f"plt.scatter(y_test_{nid}, y_pred_{nid}, alpha=0.5)\n"
                f"plt.xlabel('Vraies valeurs')\n"
                f"plt.ylabel('Prédictions')\n"
                f"plt.title('Prédictions vs Réelles')\n"
                f"plt.savefig('predictions_{nid}.png')\n"
                f"plt.close()\n"
            )
        nid = node.id
        return (
            f"import matplotlib.pyplot as plt\n"
            f"import numpy as np\n"
            f"rewards_{nid} = [mean_reward_{nid}]\n"
            f"plt.bar(['Moyenne'], rewards_{nid})\n"
            f"plt.ylabel('Récompense')\n"
            f"plt.title('Évaluation - {nid}')\n"
            f"plt.savefig('eval_{nid}.png')\n"
            f"plt.close()\n"
        )

    def _space_expr(self, node) -> str:
        space_type = node.params.get("space_type", "Discrete")
        if space_type == "Discrete":
            n = node.params.get("n", 2)
            return f"spaces.Discrete(n={n})"
        elif space_type == "Box":
            low = node.params.get("low", "[-1.0]")
            high = node.params.get("high", "[1.0]")
            dtype = node.params.get("dtype", "float32")
            return f"spaces.Box(low=np.array({low}), high=np.array({high}), dtype=np.{dtype})"
        elif space_type == "MultiBinary":
            n = node.params.get("n", 2)
            return f"spaces.MultiBinary(n={n})"
        elif space_type == "MultiDiscrete":
            n = node.params.get("n", "[2, 2]")
            return f"spaces.MultiDiscrete(nvec=np.array({n}))"
        return "spaces.Discrete(n=2)"

    def _resolve_var(self, node_id: str, port_name: str) -> str:
        return f"{node_id}_{port_name}"

    def _serialize_param(self, value, param_type: str) -> str:
        if value is None:
            return "None"
        if param_type == "str":
            escaped = str(value).replace("'", "\\'").replace('"', '\\"')
            return f"'{escaped}'"
        if param_type == "bool":
            return "True" if value else "False"
        return str(value)

    def _extract_imports(self, code: str, imports: set[str]) -> str:
        for line in code.split("\n"):
            stripped = line.strip()
            if stripped.startswith("import ") or stripped.startswith("from "):
                imports.add(stripped)
        lines = []
        for line in code.split("\n"):
            stripped = line.strip()
            if stripped.startswith("import ") or stripped.startswith("from "):
                continue
            lines.append(line)
        return "\n".join(lines)

    def _assemble(self, imports: set[str], body_lines: list[str]) -> str:
        lines = []
        lines.append('"""')
        lines.append("Generated by MLBlock")
        lines.append('"""')
        lines.append("")

        for imp in sorted(imports):
            lines.append(imp)
        if imports:
            lines.append("")

        lines.append("")
        lines.append("def main():")
        for block in body_lines:
            for line in block.split("\n"):
                stripped = line.strip()
                if stripped and not stripped.startswith("#"):
                    lines.append(f"    {line}")
        lines.append("")
        lines.append('if __name__ == "__main__":')
        lines.append("    main()")
        lines.append("")
        return "\n".join(lines)
