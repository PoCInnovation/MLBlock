from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

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

BLOCK = BlockSpec(
    label="Jouer un episode",
    category="visualization",
    params={
        "max_steps": ParamSpec(type="int", default=500),
    },
    inputs=[
        PortSpec(name="model", dtype="RLModel"),
        PortSpec(name="env", dtype="Environment"),
    ],
    outputs=[],
    template=_TEMPLATE,
)
