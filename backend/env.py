from __future__ import annotations

import asyncio
import collections
import json
from typing import Any, SupportsFloat

import nest_asyncio
import numpy as np
from gymnasium import spaces
from gymnasium.core import RenderFrame, ObsType, ActType, Env
from gymnasium.spaces import MultiDiscrete

nest_asyncio.apply()


def calculate_reward(new_state):
    # TODO: Correctly calculate reward
    reward = 0
    done = False
    terminated = False
    info = {}

    reward += new_state['time']
    reward += new_state['totalClick']
    reward += new_state['completedDecks'] * 50

    if len(new_state) == 8:
        done = True
    return reward, done, terminated, info


class SpiderEnv(Env):
    def __init__(self, socket):
        self.websocket = socket

        max_elems_per_row = 25  # Define a maximum length for sublists in activeCards
        num_card_rows = 10  # Number of sublists
        num_cards = 13  # number of cards
        num_decks = 8  # number of decks
        self.observation_space = spaces.Dict({
            'time': spaces.Box(low=0, high=5000, dtype=np.float32),
            'totalClick': spaces.Box(low=0, high=5000, shape=(1,), dtype=np.int32),
            'completedDecks': spaces.Box(low=0, high=num_decks, shape=(1,), dtype=np.int32),
            'remSets': spaces.Box(low=0, high=num_decks, shape=(1,), dtype=np.int32),
            'activeCards': spaces.Box(low=0, high=num_cards, shape=(num_card_rows, max_elems_per_row), dtype=np.int32),
            'activeCardLengths': spaces.Box(low=0, high=max_elems_per_row, shape=(num_card_rows,), dtype=np.int32)
        })

        low = np.array([0, 0, 0, 0, 0])
        high = np.array([num_cards, num_decks, max_elems_per_row, num_card_rows, num_card_rows])
        # TODO:  UserWarning: WARN: For Box action spaces, we recommend using a symmetric and normalized space (range=[-1, 1] or [0, 1]). See https://stable-baselines3.readthedocs.io/en/master/guide/rl_tips.html for more information.
        # TODO: nu ai adaugat valori in action space pentru undo si remCards
        # self.action_space = spaces.Box(low=low, high=high, shape=(5,), dtype=np.int32)
        # TODO: pt a scapa de valori float, ChatGPT sugereaza asta: action = np.round(action).astype(np.int32)
        self.action_space = MultiDiscrete([13, 8, 10, 13, 10])
        """Action space represents value(1-13), deck (1-8), moveFrom (1-10), moveTo (1-10) 
        ex: [3,3,0,2,5] -> move ((card 3 identified by deck 3 (it's unique)) from row 0)) to (el 2, row 5)"""

    def step(self, action: ActType) -> tuple[ObsType, SupportsFloat, bool, bool, dict[str, Any]]:
        asyncio.run(self.websocket.send(f"'action': {action}"))

        message = asyncio.run(self.websocket.recv())
        new_state = self.process_message(message)

        reward, done, terminated, info = calculate_reward(new_state)

        return new_state, reward, terminated, done, info

    def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None) -> tuple[
        ObsType, dict[str, Any]]:
        super().reset(seed=seed)
        """Am facut o mica smecherie. Trimit mesajul de restart si doar apasul butonul de restart,
        iar in websocket.onConnect am pus `setGameState`."""
        # TODO: pot scoate "mesajul" si sa extrag din actiune direct. Ex: daca trimit 0,0,0,0,0 -> restart

        asyncio.run(self.websocket.send(f"'action': 'restart'"))

        message = asyncio.run(self.websocket.recv())
        new_state = self.process_message(message)

        return new_state, {}

    def process_message(self, message):
        message = json.loads(message)

        max_length = self.observation_space['activeCards'].shape[1]
        active_cards = np.array([np.array([0] * max_length, dtype=np.int32) for row in message['activeCards']],
                                dtype=np.int32)

        for i, row in enumerate(message['activeCards']):
            for j, card in enumerate(row):
                active_cards[i][j] = int(card['value'])

        new_obs = {
            'time': np.array([float(message['time'])], dtype=np.float32),
            'totalClick': np.array([int(message['totalClick'])], dtype=np.int32),
            'completedDecks': np.array([int(message['completedDecks'])], dtype=np.int32),
            'remSets': np.array([int(message['remSets'])], dtype=np.int32),
            'activeCards': np.array(active_cards, dtype=np.int32),
            'activeCardLengths': np.array([len(row) for row in message['activeCards']], dtype=np.int32)
        }
        observation = collections.OrderedDict(sorted(new_obs.items()))
        return observation

    def close(self):
        super().close()
