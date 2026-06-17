from gymnasium.wrappers import RecordVideo


def BUILD(params):
    env = params["_inputs"]["env"]
    trigger = params.get("episode_trigger", 1)
    return {
        "env": RecordVideo(
            env,
            video_folder=params.get("video_folder", "./videos"),
            episode_trigger=lambda x: x % trigger == 0,
        )
    }


BLOCK = {
    "label": "Enregistrer une vidéo",
    "category": "visualization",
    "params": {
        "video_folder": {"type": "str", "default": "./videos"},
        "episode_trigger": {"type": "int", "default": 1},
    },
    "inputs": [{"name": "env", "dtype": "Environment"}],
    "outputs": [{"name": "env", "dtype": "Environment"}],
    "template": (
        "from gymnasium.wrappers import RecordVideo\n"
        "{output.env} = RecordVideo({input.env}, "
        "video_folder='{params.video_folder}', "
        "episode_trigger=lambda x: x % {params.episode_trigger} == 0)"
    ),
}
