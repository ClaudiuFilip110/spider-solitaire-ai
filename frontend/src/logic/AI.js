import {cardsInPlay, findLink} from "./linkedlist";
import CardGenerator from "./CardGenerator";

export const sendGameState = (gameState, socket) => {
    if (socket == null)
        return
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(gameState));
    }
}


export const fakeClickCard = (clickCard, action, allCards, setTriggerSecondClick) => {
    try {
        let [valueFrom, deckFrom, from, valueTo, deckTo, to] = action; ///Action space represents value(1-13), deck (1-8), rowFrom (0-10), value (1-13), deck (1-8), rowTo (1-10)

        let cardFrom = findLink(allCards, deckFrom, `${valueFrom}`);
        let cardTo = findLink(allCards, deckTo, `${valueTo}`);

        // console.log('action from BE', action)
        // console.log('allCards', allCards)
        // console.log('cards in play', cardsInPlay(allCards))
        // console.log(cardFrom);
        // console.log(cardTo);


        if (cardFrom !== undefined && cardTo !== undefined) {

            console.log(`Clicking ${cardFrom.val['value']} on row ${from}; Clicking ${cardTo.val['value']} on row ${to}`)
            if (+cardFrom.val['value'] === (+cardTo.val['value'] + 1)) {
                console.log('VALID CLICK')
                const fakeFirstClick = clickCard(cardFrom, from);
                fakeFirstClick();

                setTriggerSecondClick({trigger: true, moveTo: cardTo, to: to});
            }
        }
    } catch (e) {
        console.log("ERROR?", e)
    }
}

export const fakeClickUndo = (clickUndo) => {
    clickUndo();
}

export const fakeClickRemCards = (clickRemCards) => {
    clickRemCards();
}

export const fakeClickRestart = (setAllCards, setRemCards, setComplete) => {
    const {
        card_initial,
        card_rem
    } = CardGenerator()
    console.log(card_initial)
    // setAllCards([card_initial])
    // setRemCards(...card_rem)
    // setComplete(0)
}