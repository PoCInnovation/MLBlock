from chedli.mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

_TEMPLATE = (
    "import matplotlib.pyplot as plt\n"
    "X_test_{node_id} = {input.test_data}.drop({params.target_column}, axis=1)\n"
    "y_test_{node_id} = {input.test_data}[{params.target_column}]\n"
    "y_pred_{node_id} = {input.model}.predict(X_test_{node_id})\n"
    "plt.scatter(y_test_{node_id}, y_pred_{node_id}, alpha=0.5)\n"
    "plt.xlabel('Vraies valeurs')\n"
    "plt.ylabel('Prédictions')\n"
    "plt.title('Prédictions vs Réelles')\n"
    "plt.savefig({params.output_path})\n"
    "plt.close()\n"
    "print('Graphique sauvegardé: ' + str({params.output_path}))"
)

BLOCK = BlockSpec(
    label="Graphique prédictions vs réelles",
    category="visualization",
    params={
        "target_column": ParamSpec(
            type="str",
            required=True,
            description="Nom de la colonne cible",
        ),
        "output_path": ParamSpec(
            type="str",
            default="predictions.png",
            description="Chemin de sauvegarde du graphique",
        ),
    },
    inputs=[
        PortSpec(name="model", dtype="Model"),
        PortSpec(name="test_data", dtype="DataFrame"),
    ],
    outputs=[],
    template=_TEMPLATE,
)
