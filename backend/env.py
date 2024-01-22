from __future__ import annotations

import asyncio
import collections
import json
import time
from typing import Any, SupportsFloat

import nest_asyncio
import numpy as np
from gymnasium import spaces
from gymnasium.core import ObsType, ActType, Env
from gymnasium.spaces import MultiDiscrete

nest_asyncio.apply()


class SpiderEnv(Env):
    def __init__(self, socket, max_steps):
        self.websocket = socket
        self.max_steps = max_steps
        self.curr_steps = 0
        max_elems_per_row = 15  # Define a maximum length for sublists in activeCards
        num_card_rows = 10  # Number of sublists
        num_cards = 13  # number of cards
        num_decks = 8  # number of decks
        num_sets = 6  # max number of sets

        self.observation_space = spaces.Dict({
            'completedDecks': spaces.Discrete(num_decks),
            'remSets': spaces.Discrete(num_sets),
            'activeCards': spaces.Box(low=0, high=max_elems_per_row, shape=(num_card_rows, max_elems_per_row),
                                      dtype=np.int32),
        })
        self.action_space = MultiDiscrete(
            [num_cards + 2, num_decks, num_card_rows, num_cards, num_decks, num_card_rows])
        """Action space represents value(1-15), deck (0-7), rowFrom (0-9), value (1-15), deck (0-7), rowTo (0-9) 
        ex: [3,3,0,2,2,5] -> move ((card 3, deck 3) from row 0)) to ((el 2, deck 2), row 5)
        THE +2 is for the 2 extra actions: undo and reset. For both, the other values are irrelevant"""

    def step(self, action: ActType) -> tuple[ObsType, SupportsFloat, bool, bool, dict[str, Any]]:
        self.curr_steps += 1
        action = {'action': action.tolist()}
        data = json.dumps(action)

        asyncio.run(self.websocket.send(data))

        message = asyncio.run(self.websocket.recv())
        new_state = self.process_message(message)
        reward, done, terminated, info = self.calculate_reward(new_state)

        return new_state, reward, terminated, done, info

    def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None) -> tuple[
        ObsType, dict[str, Any]]:
        super().reset(seed=seed)

        action = {'action': [0] * 6}
        data = json.dumps(action)
        asyncio.run(self.websocket.send(data))

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
                active_cards[i][j] = int(card)

        new_obs = {
            'completedDecks': int(message['completedDecks']),
            'remSets': int(message['remSets']),
            'activeCards': active_cards,
        }
        observation = collections.OrderedDict(sorted(new_obs.items()))
        return observation

    def calculate_reward(self, new_state):
        reward = 0
        done = False
        terminated = False
        info = {}

        if self.curr_steps == self.max_steps:
            reward -= 100
            self.curr_steps = 0
            terminated = True
        return reward, done, terminated, info

    def close(self):
        super().close()
