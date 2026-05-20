from chedli.mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Enregistrer une vidéo",
    category="visualization",
    params={
        "video_folder": ParamSpec(
            type="str",
            default="./videos",
            description="Dossier de sauvegarde des vidéos",
        ),
        "episode_trigger": ParamSpec(
            type="int",
            default=1,
            description="Enregistrer tous les N épisodes",
        ),
    },
    inputs=[PortSpec(name="env", dtype="Environment")],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "from gymnasium.wrappers import RecordVideo\n"
        "{output.env} = RecordVideo({input.env}, "
        "video_folder='{params.video_folder}', "
        "episode_trigger=lambda x: x % {params.episode_trigger} == 0)"
    ),
)
