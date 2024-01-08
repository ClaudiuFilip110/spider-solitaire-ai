export const sendGameState = (allCards, time, totalClick, complete) => {
    console.log('sending game state')
    // console.log('time', time)
    // console.log('total clicks', totalClick)
    // console.log('completed decks', complete)
    if (totalClick === 0)
        totalClick = 1
    let score = ((complete+1) * 250) / (time * totalClick)
    console.log('current score is', score)
    // TODO: add correct calculation for score

    const backendEndpoint = 'http://localhost:8000/get_game_state';

    const gameState = {
        "allCards": allCards,
        score: 3.3
    }
    fetch(backendEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameState)
    })
        .then(response => response.json())
        .then(data => {
            console.log('data from backend', data);

        })
        .catch(error => {
            console.error('Error from backend:', error);
            alert('Error from backend. Try again')
        });
}