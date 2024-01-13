import asyncio
import warnings

import websockets
from gymnasium.utils.env_checker import check_env
from stable_baselines3 import PPO, DQN, A2C

from env import SpiderEnv

warnings.filterwarnings("ignore")


async def handler(websocket):
    try:
        env = SpiderEnv(websocket)
        # check_env(env)
        # model = PPO("MultiInputPolicy", env, verbose=1)
        model = A2C("MultiInputPolicy", env, verbose=1)
        model.learn(10000, progress_bar=True)
        # TODO: Add training monitoring capabilities

    except websockets.exceptions.ConnectionClosed as exception:
        print(f"[SERVER-ERROR] ==> Connection closed exception {exception}")
    # remove connection from connections array
    finally:
        print("[SERVER] ==> Client disconnected")


async def main():
    async with websockets.serve(handler, "localhost", 6789):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
