import pandas as pd


def BUILD(params):
    return {"dataset": pd.read_csv(params["path"])}


BLOCK = {
    "label": "Charger un CSV",
    "category": "data",
    "params": {
        "path": {"type": "str", "required": True},
    },
    "inputs": [],
    "outputs": [{"name": "dataset", "dtype": "DataFrame"}],
    "template": (
        "import pandas as pd\n"
        "{output.dataset} = pd.read_csv({params.path})"
    ),
}
