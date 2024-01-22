import asyncio
import os
from typing import Callable

import websockets
from matplotlib import pyplot as plt
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import CheckpointCallback
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.results_plotter import load_results, ts2xy
from stable_baselines3.common.utils import get_latest_run_id

from env import SpiderEnv


def plot(log_dir):
    x, y = ts2xy(load_results(log_dir), 'timesteps')
    plt.figure(figsize=(6, 4))
    plt.plot(x, y)
    plt.xlabel('Number of Timesteps')
    plt.ylabel('Rewards')
    plt.title('Training Progress')
    plt.show()


def linear_schedule(initial_value: float) -> Callable[[float], float]:
    """
    Linear learning rate schedule.

    :param initial_value: Initial learning rate.
    :return: schedule that computes
      current learning rate depending on remaining progress
    """

    def func(progress_remaining: float) -> float:
        """
        Progress will decrease from 1 (beginning) to 0.

        :param progress_remaining:
        :return: current learning rate
        """
        return progress_remaining * initial_value

    return func


async def handler(websocket):
    try:
        log_dir = "logs/"

        tensorboard_log = os.path.join(log_dir, "tensorboard")
        timesteps = int(1e7)
        save_every = timesteps // 5
        max_steps = int(1e5)
        lr = 3e-5
        env = SpiderEnv(websocket, max_steps=max_steps)
        env = Monitor(env, log_dir)

        model = PPO("MultiInputPolicy", env, verbose=1, tensorboard_log=tensorboard_log,
                    learning_rate=linear_schedule(lr))
        # model = A2C("MultiInputPolicy", env, verbose=1)

        latest_run_id = get_latest_run_id(tensorboard_log, "PPO") + 1
        run_name = f"PPO_{latest_run_id}"
        tensorboard_log = os.path.join(tensorboard_log, run_name)
        checkpoint_callback = CheckpointCallback(save_freq=save_every,
                                                 save_path=tensorboard_log, name_prefix="ppo_model")
        # eval_callback = EvalCallback(env, best_model_save_path=log_dir, log_path=log_dir, eval_freq=500)

        model.learn(timesteps, progress_bar=True, callback=[checkpoint_callback])

        plot(log_dir)

    except websockets.exceptions.ConnectionClosed as exception:
        print(f"[SERVER-ERROR] ==> Connection closed exception {exception}")
    except Exception as e:
        print(f'Error in main.py: {e}')

    finally:
        print("[SERVER] ==> Client disconnected")
        exit(0)


async def main():
    async with websockets.serve(handler, "localhost", 6789):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
