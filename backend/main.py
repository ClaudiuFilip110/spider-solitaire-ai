from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from data.GameState import GameState

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/get_game_state")
async def get_game_state(game_state: GameState):
    print(f'game state: {game_state}')
    return {"message": "get game state"}
