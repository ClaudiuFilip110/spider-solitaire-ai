import asyncio

import websockets
from websockets import ConnectionClosedOK


async def handler(websocket, path):
    try:
        while True:
            message = await websocket.recv()
            print(f"Received message from client: {message}")
            response = "Action to take"
            await websocket.send(response)
    except ConnectionClosedOK as e:
        print('error closing the connection')


start_server = websockets.serve(handler, "localhost", 6789)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
