export const sendGameState = (gameState, socket) => {
    console.log(gameState)
    if(socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(gameState));
        }
}