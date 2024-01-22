import {findIndex, findLink} from "./linkedlist";
import CardGenerator from "./CardGenerator";

export const sendGameState = (gameState, socket) => {
    if (socket == null)
        return
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(gameState));
    }
}


export const fakeClickCard = (clickCard, action, allCards, setTriggerSecondClick, setTotalClick) => {
    try {
        let [valueFrom, deckFrom, from, valueTo, deckTo, to] = action; ///Action space represents value(1-13), deck (1-8), rowFrom (0-10), value (1-13), deck (1-8), rowTo (1-10)

        let cardFrom = findLink(allCards, deckFrom, `${valueFrom}`);
        let cardTo = findLink(allCards, deckTo, `${valueTo}`);

        let cardFromIndex = findIndex(allCards, deckFrom, `${valueFrom}`);
        let cardToIndex = findIndex(allCards, deckTo, `${valueTo}`);

        // daca NU am gasit carti SAU cartile pe care le-am gasit sunt intoarse
        if (cardFrom === undefined || cardTo === undefined ||
            !cardFrom.val['show'] || !cardTo.val['show']) {
            setTotalClick((val) => val + 5)
            return;
        }

        // daca cartile pe care le-am gasit nu sunt pe coloana specificata de actiune
        if (from !== cardFromIndex || to !== cardToIndex) {
            setTotalClick((val) => val + 5)
            return;
        }

        let active_cards = activeCards(allCards);

        let lastItemDeck = active_cards[to][active_cards[to].length - 1]['deck'];
        let lastItemValue = active_cards[to][active_cards[to].length - 1]['value'];
        let lastItemIndex =findIndex(allCards, lastItemDeck, lastItemValue);
        let lastItemCard = findLink(allCards, lastItemDeck, lastItemValue);

        // verificam daca cardTo exista in randul corect, DAR nu e ultima carte
        if (cardTo.val !== lastItemCard.val || cardTo.next !== lastItemCard.next) {
            setTotalClick((val) => val + 5)
            return;
        }

        console.log(`Card ${cardFrom['val']['value']} at row ${cardFromIndex+1} -> ${cardTo['val']['value']} at row ${lastItemIndex+1}`)
        const fakeFirstClick = clickCard(cardFrom, from);
        fakeFirstClick();

        setTriggerSecondClick({ trigger: true, moveTo: lastItemCard });
        // fakeSecondClick(to, cardTo, allCards, clickCard);
    }
    catch (e) {
        console.log("ERROR Could not find card", e);
    }
}

export const fakeClickUndo = (clickUndo) => {
    clickUndo();
}

export const fakeClickRemCards = (clickRemCards) => {
    clickRemCards();
}

export const fakeClickRestart = (setAllCards, setRemCards, setTotalClick, setComplete) => {
    const {
        card_initial,
        card_rem
    } = CardGenerator()
    setAllCards(card_initial)
    setRemCards(card_rem)
    setTotalClick(0)
    setComplete(0)
}