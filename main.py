"""
Généré par MLBlock
"""

from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.evaluation import evaluate_policy
import matplotlib.pyplot as plt
import numpy as np
import torch

def main():
    try:
        # gym_env: n1
        n1_env = make_vec_env('CartPole-v1', n_envs=4)
    except Exception as e:
        print(f"[ERROR] n1 (gym_env): {e}")
        raise
    
    try:
        # train_rl: n2
        n2_model = PPO(
            'MlpPolicy',
            n1_env,
            learning_rate=0.0003,
            gamma=0.99,
            verbose=1
        )
        n2_model.learn(total_timesteps=1000)
        n2_model.save('PPO_n2')
    except Exception as e:
        print(f"[ERROR] n2 (train_rl): {e}")
        raise
    
    try:
        # evaluate_rl: n3
        mean_reward_n3, std_reward_n3 = evaluate_policy(
            n2_model, n1_env, n_eval_episodes=5)
        n3_mean_reward = mean_reward_n3
        print(f'Evaluation - Recompense moyenne: {mean_reward_n3:.2f} +/- {std_reward_n3:.2f}')
        rewards_n3 = [mean_reward_n3]
        plt.bar(['Moyenne'], rewards_n3)
        plt.ylabel('Récompense')
        plt.title('Évaluation - n3')
        plt.savefig('eval_n3.png')
        plt.close()
    except Exception as e:
        print(f"[ERROR] n3 (evaluate_rl): {e}")
        raise
    

if __name__ == "__main__":
    main()
