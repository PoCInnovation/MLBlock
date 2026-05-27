from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

_TEMPLATE = (
    "from stable_baselines3 import {raw_params.algorithm}\n"
    "import torch\n"
    "{output.model} = {raw_params.algorithm}(\n"
    "    {params.policy},\n"
    "    {input.env},\n"
    "    learning_rate={params.learning_rate},\n"
    "    gamma={params.gamma},\n"
    "    verbose=1\n"
    "{', seed=' + str(params.seed) if params.seed is not None else ''})\n"
    "{output.model}.learn(total_timesteps={params.total_timesteps})\n"
    "{output.model}.save('{raw_params.algorithm}_{node_id}')"
)

BLOCK = BlockSpec(
    label="Entraîner un agent RL",
    category="rl",
    params={
        "algorithm": ParamSpec(
            type="str",
            default="PPO",
            description="PPO, DQN, SAC, A2C, TD3",
        ),
        "total_timesteps": ParamSpec(type="int", default=100000),
        "learning_rate": ParamSpec(type="float", default=3e-4),
        "gamma": ParamSpec(type="float", default=0.99),
        "policy": ParamSpec(type="str", default="MlpPolicy"),
        "seed": ParamSpec(type="int", default=None),
    },
    inputs=[PortSpec(name="env", dtype="Environment")],
    outputs=[PortSpec(name="model", dtype="RLModel")],
    template=_TEMPLATE,
)
