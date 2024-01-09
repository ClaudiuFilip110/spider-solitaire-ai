from __future__ import annotations

from typing import Any, SupportsFloat

import numpy as np
from gymnasium import Env, spaces
from gymnasium.core import RenderFrame, ObsType, ActType


class SpiderEnv(Env):
    def __init__(self, allCards: list, score: float):
        self.cards = allCards
        self.score = score

        max_sublist_length = 20  # Define a maximum length for sublists in activeCards
        num_sublists = 10  # Number of sublists
        self.observation_space = spaces.Dict({
            'time': spaces.Box(low=0, high=5000, dtype=np.float32),
            'totalClick': spaces.Discrete(1),
            'completedDecks': spaces.Discrete(1),
            'remSets': spaces.Discrete(1),
            'activeCards': spaces.Box(low=-1, high=13, shape=(num_sublists, max_sublist_length), dtype=np.int32),
            'activeCardLengths': spaces.Box(low=0, high=max_sublist_length, shape=(num_sublists,), dtype=np.int32)
        })

        low = np.array([0, 0, 0, 0])
        high = np.array([14, 50, 14, 50])
        self.action_space = spaces.Box(low=low, high=high, dtype=np.int32)


def step(self, action: ActType) -> tuple[ObsType, SupportsFloat, bool, bool, dict[str, Any]]:
    """Returnam noul state
    avem action (actiunea noastra) -> schimbam scorul, schimbam cartile vizibile si creem noua stare

    In final returnam noua stare, reward'ul, daca e terminat jocul si info.
    """
    # TODO: rezolva cu actiunea
    # return np.array(state, dtype=np.float32), reward, terminated, False, {}
    pass


def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None) -> tuple[
    ObsType, dict[str, Any]]:
    return super().reset(seed=seed, options=options)


def render(self) -> RenderFrame | list[RenderFrame] | None:
    print("didn't add a rendering option")
    pass


def close(self):
    super().close()
