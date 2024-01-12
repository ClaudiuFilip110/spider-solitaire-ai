export const sendGameState = (gameState, socket) => {
    if (socket == null)
        return
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(gameState));
    }
}