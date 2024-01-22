import asyncio
import os

import websockets
from stable_baselines3 import PPO

from env import SpiderEnv


async def handler(websocket):
    try:
        log_dir = "logs/"
        os.makedirs(log_dir, exist_ok=True)
        tensorboard_log = os.path.join(log_dir, "tensorboard")
        model_file = os.path.join(tensorboard_log, "PPO_1")
        model_file = os.path.join(model_file, "ppo_5000000_steps")

        env = SpiderEnv(websocket, max_steps=500000)
        model = PPO.load("./logs/tensorboard/PPO_9/ppo_model_1000000_steps.zip", env=env)
        # env = Monitor(env, log_dir)

        env = model.get_env()
        obs = env.reset()
        for i in range(1000):
            action, _states = model.predict(obs, deterministic=True)
            obs, rewards, dones, info = env.step(action)

    except websockets.exceptions.ConnectionClosed as exception:
        print(f"[SERVER-ERROR] ==> Connection closed exception {exception}")
    except Exception as e:
        print(f"EXCEPTION: {e}")
    finally:
        print("[SERVER] ==> Client disconnected")
        exit(0)


async def main():
    async with websockets.serve(handler, "localhost", 6789):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())

