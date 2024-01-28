from __future__ import annotations

import asyncio
import collections
import json
from typing import Any, SupportsFloat

import nest_asyncio
import numpy as np
from gymnasium import spaces
from gymnasium.core import ObsType, ActType, Env

nest_asyncio.apply()


class SpiderEnv(Env):
    def __init__(self, socket, max_steps):
        self.websocket = socket
        self.max_steps = max_steps
        self.curr_steps = 0
        self.max_elems_per_row = 15  # Define a maximum length for sublists in activeCards
        self.num_card_rows = 10  # Number of sublists
        num_cards = 13  # number of cards
        num_decks = 8  # number of decks
        self.total_cards = num_cards * num_decks
        self.ACTION_TYPES = 3  # types of action: move card, deck draw, undo

        self.card_mapping = {
            i * num_decks + j: (i + 1, j)
            for i in range(num_cards)
            for j in range(num_decks)
        }
        self.inverse_mapping = {v: k for k, v in self.card_mapping.items()}

        self.visibility_cards = np.zeros((self.num_card_rows, self.max_elems_per_row), dtype=np.int32) - 1
        self.curr_state = collections.OrderedDict(sorted({
                                                             'cardsInPlay': np.zeros(
                                                                 (self.num_card_rows, self.max_elems_per_row),
                                                                 dtype=np.int32) - 1,
                                                             'numCardsInPlay': 0,
                                                             'completedDecks': 0,
                                                         }.items()))

        self.observation_space = spaces.Dict({
            'cardsInPlay': spaces.Box(low=0, high=self.total_cards,
                                      shape=(self.num_card_rows, self.max_elems_per_row),
                                      dtype=np.int32),
            'numCardsInPlay': spaces.Discrete(self.total_cards),
            'completedDecks': spaces.Discrete(num_decks),
        })

        self.action_space = spaces.MultiDiscrete([
            self.ACTION_TYPES,  # 0: Card move, 1: Deck draw, 2: Undo
            self.num_card_rows * self.max_elems_per_row,  # the index of the first card I want to click
            self.num_card_rows * self.max_elems_per_row  # the index of the second card I want to click
        ])

    def step(self, action: ActType) -> tuple[ObsType, SupportsFloat, bool, bool, dict[str, Any]]:
        to_send = np.array([0] * 6, dtype=np.int32)
        # Process the action here
        action_type, first_click, second_click = action

        source_row, source_index = divmod(first_click, self.max_elems_per_row)
        destination_row, destination_index = divmod(second_click, self.max_elems_per_row)

        first_card = self.curr_state['cardsInPlay'][source_row, source_index]
        second_card = self.curr_state['cardsInPlay'][destination_row, destination_index]

        val = np.array(self.card_mapping[first_card]), source_row, np.array(
            self.card_mapping[second_card]), destination_row

        to_send = np.hstack(val)
        to_send_list = to_send.tolist()
        to_send_list = [int(item) for item in to_send_list]

        _action = {'action': int(action_type), 'clicks': to_send_list}
        data = json.dumps(_action)

        asyncio.run(self.websocket.send(data))

        message = asyncio.run(self.websocket.recv())
        new_state, visibility_cards = self.process_message(message)
        self.visibility_cards = visibility_cards

        reward, done, terminated, info = self.calculate_reward(action_type, new_state)
        return new_state, reward, terminated, done, info

    def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None) -> tuple[
        ObsType, dict[str, Any]]:
        super().reset(seed=seed)

        action = {'action': -1}
        data = json.dumps(action)
        asyncio.run(self.websocket.send(data))

        message = asyncio.run(self.websocket.recv())
        new_state, visibility_cards = self.process_message(message)
        self.curr_state = new_state
        self.visibility_cards = visibility_cards
        self.curr_steps = 1
        return new_state, {}

    def process_message(self, message):
        message = json.loads(message)

        all_cards, visibility_cards = self.all_cards(message['cardsInPlay'])

        new_obs = {
            'cardsInPlay': all_cards,
            'numCardsInPlay': np.count_nonzero(~(all_cards == -1)),
            'completedDecks': message['completedDecks'],
        }
        observation = collections.OrderedDict(sorted(new_obs.items()))
        return observation, visibility_cards

    def calculate_reward(self, action_type, new_state, is_invalid_move=False):
        reward = 0
        done = False
        terminated = False
        info = {}

        # TODO: create a reward policy
        if np.array_equal(new_state['cardsInPlay'], self.curr_state['cardsInPlay']):
            reward = -1

        if self.curr_steps == self.max_steps:
            # reward -= 100
            self.curr_steps = 0
            terminated = True
        else:
            self.curr_steps += 1

        if action_type == 1:  # undo
            reward = 10
        if action_type == 2:  # draw
            reward = 10
        # if is_invalid_move:
        #     reward = -1
        # else:
        #     reward += 10000
        return reward, done, terminated, info

    def close(self):
        super().close()

    def all_cards(self, all_cards):
        new_cards = np.zeros((self.num_card_rows, self.max_elems_per_row), dtype=np.int32) - 1
        visibility_cards = np.zeros((self.num_card_rows, self.max_elems_per_row), dtype=np.int32) - 1

        for i in range(len(all_cards)):
            for j in range(len(all_cards[i])):
                new_cards[i][j] = self.inverse_mapping[int(all_cards[i][j]['value']), all_cards[i][j]['deck']]
                visibility_cards[i][j] = all_cards[i][j]['show']

        return new_cards, visibility_cards
