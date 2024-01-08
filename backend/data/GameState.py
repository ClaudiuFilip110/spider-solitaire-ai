from pydantic import BaseModel


class GameState(BaseModel):
    allCards: list
    score: float
