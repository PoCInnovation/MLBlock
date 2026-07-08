import gymnasium as gym


def BUILD(params):
    model = params["_inputs"]["model"]
    env = params["_inputs"]["env"]
    render_env = gym.make(env.spec.id if hasattr(env, 'spec') else "CartPole-v1", render_mode='human')
    obs, _ = render_env.reset()
    for _ in range(params.get("max_steps", 500)):
        action, _ = model.predict(obs)
        obs, _, terminated, truncated, _ = render_env.step(action)
        if terminated or truncated:
            break
    render_env.close()
    return {}


_TEMPLATE = (
    "import gymnasium as gym\n"
    "render_env_{node_id} = gym.make({input.env}, render_mode='human')\n"
    "obs_{node_id}, _ = render_env_{node_id}.reset()\n"
    "for _ in range({params.max_steps}):\n"
    "    action_{node_id}, _ = {input.model}.predict(obs_{node_id})\n"
    "    obs_{node_id}, _, terminated_{node_id}, truncated_{node_id}, _ = render_env_{node_id}.step(action_{node_id})\n"
    "    if terminated_{node_id} or truncated_{node_id}:\n"
    "        break\n"
    "render_env_{node_id}.close()"
)

BLOCK = {
    "label": "Jouer un episode",
    "category": "visualization",
    "params": {
        "max_steps": {"type": "int", "default": 500},
    },
    "inputs": [
        {"name": "model", "dtype": "RLModel"},
        {"name": "env", "dtype": "Environment"},
    ],
    "outputs": [],
    "template": _TEMPLATE,
}
