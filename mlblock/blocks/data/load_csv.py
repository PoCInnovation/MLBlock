from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Charger un CSV",
    category="data",
    params={
        "path": ParamSpec(
            type="str",
            required=True,
            description="Chemin du fichier CSV",
        ),
    },
    inputs=[],
    outputs=[PortSpec(name="dataset", dtype="DataFrame")],
    template=(
        "import pandas as pd\n"
        "{output.dataset} = pd.read_csv({params.path})"
    ),
)
