import React, { useState, useEffect } from 'react'
import '../../assets/css/card.css'
import CardGenerator, {card} from '../../logic/CardGenerator'
import Navbar from '../Navbar/Navbar'
import {
    clickGetCards,
    checkComplete,
    firstClick,
    secondClick,
    removeCardOldPlace,
    undoPlacement,
    getPrev,
    removeHighlight,
    undoDistribution,
    anyBlank, getHint, getCompleteHint
}
    from '../../logic/Gameplay'
import { cardsPush } from '../../logic/ComponentCreate'
import CardHolder from '../CardHolder/CardHolder'
import { Redirect } from 'react-router-dom'
import shuffleAudio from '../../assets/sound/shuffle.mp3'
import flickAudio from '../../assets/sound/flick.mp3'
import {sendGameState} from "../../logic/AI";

const Game = () => {

    const {
        card_initial,
        card_rem
    } = CardGenerator()

    const [ allCards, setAllCards ] = useState(card_initial) // contains all cards
    const [ highlighted, setHighlighted ] = useState({}) // keeps highlighted card, set when every first click to card
    const [ active, setActive ] = useState(false) // active means we have highlighted card so if any click triggered need to control for placement
    const [ request, setRequest ] = useState(0) // request keeps how many deck of cards will come from remaining cards
    const [ remCards, setRemCards ] = useState(card_rem) // remaining cards
    const [ complete, setComplete ] = useState(0) // complete keeps how many decks will completed
    const [ prevCards, setPrevCards ] = useState(null) // keep prev card for undo
    const [ canUndo, setCanUndo ] = useState(false) // undo control
    const [ undoDistribute, setUndoDistribute ] = useState(false) // undo after distribute new cards control
    const [ totalClick, setTotalClick ] = useState(0) // totalclick value for final score
    const [ time, setTime ] = useState(0) // hold time for display at final page
    const [socket, setSocket] = useState(null);
    const [gameState,
        setGameState] = useState({
                        time: time,
                        totalClick: totalClick,
                        completedDecks: complete,
                        remSets: (remCards.length / 10) - 1,
                        activeCards: activeCards(allCards)
                        });
    const [triggerSecondClick, setTriggerSecondClick] = useState({trigger: false, to: null});
    // New state to track if data should be sent back to Python
    const [shouldSendBack, setShouldSendBack] = useState(false);

    useEffect(() => {
        if (shouldSendBack) {
            sendGameState(gameState, socket);
            setShouldSendBack(false);
        }
    }, [shouldSendBack, gameState, socket]);

    useEffect(() => {
        setGameState({
            time: time,
            totalClick: totalClick,
            completedDecks: complete,
            remSets: (remCards.length / 10) - 1,
            activeCards: activeCards(allCards)
        });
    }, [time, totalClick, complete, remCards, allCards]); // Dependencies


    useEffect(() => {
        // Initialize WebSocket connection
        const newSocket = new WebSocket('ws://localhost:6789');
        setSocket(newSocket);

        newSocket.onopen = () => {
            console.log('WebSocket connected');
                setGameState({
                    time: time,
                    totalClick: totalClick,
                    completedDecks: complete,
                    remSets: (remCards.length / 10) - 1,
                    activeCards: activeCards(allCards)
                });
        };

        newSocket.onmessage = (event) => {
            setShouldSendBack(true);
            let data = event.data;
            let action = null;
            try {
                let message = JSON.parse(data);
                action = message['action'];
                action[0] ++; action[3]++; // cards start from 0 in Python, but 1 in FE
                let masterAction = action[0]
                if (masterAction <= 13) {
                    fakeClickCard(clickCard, action, allCards, setTriggerSecondClick);
                } else if (masterAction === 14) {
                    fakeClickUndo(clickUndo);
                } else if (masterAction === 15) {
                    fakeClickRemCards(clickRemCards);
                } else {
                    console.log("SWITCH ERROR: Something it horribly wrong!!!!!")
                }
            }
            catch (e) {
                console.log('Error while getting data from Python: ', e)
            }
        };

        newSocket.onerror = (error) => {
            console.error('WebSocket error: ', error);
        };

        newSocket.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return () => {
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        if (triggerSecondClick.trigger) {
            if (triggerSecondClick.to !== null) {
                // Call the second click function
                let active_cards = activeCards(allCards);
                let lastElem = active_cards[triggerSecondClick.to].length-1;
                let moveTo = findLink(allCards, active_cards[triggerSecondClick.to][lastElem]['deck'], `${active_cards[triggerSecondClick.to][lastElem]['value']}`);
                if (moveTo !== null) {
                    const secondClick = clickCard(moveTo, triggerSecondClick.to);
                    secondClick();
                    setTriggerSecondClick({ trigger: false, to: triggerSecondClick.to });
                }
                else {
                    console.log('moveTo is null')
                }
            }
            else {
                console.log('TRIGGER NULL');
            }
        }
    }, [triggerSecondClick]);

    const handleTime = (time) => {
        setTime(time)
    }

    const clickHint = async () => {
        // Checking whether there is a selected card
        if (active) {
            // if yes, control all cards, if any eligible card do replacement
            if (getHint(allCards, highlighted)) {
                setTotalClick(totalClick + 3);
                setCanUndo(true)
                setUndoDistribute(false)
                CompleteControl()
            } else{
                // if not eligible card remove highlight
                console.log("No Hint Found For This Card")
                removeHighlight(highlighted)
            }
            setActive(false)
        } else{
            // if there is no selected card search all cards for any hint
            let check = await getCompleteHint(allCards)
            check ? setTotalClick(totalClick + 5) : console.log("No Hint Found")
        }
    }

    const clickUndo = () => {
        if (canUndo) {
            if (undoDistribute) {
                const prevRemCards = undoDistribution(allCards) // get distributed cards
                setRemCards([...prevRemCards, ...remCards]) // set remaining cards
                setUndoDistribute(false)
            }
            else{
                removeCardOldPlace(prevCards.newHead, allCards) // if last move not distribution undo last replacement
                undoPlacement(allCards, prevCards) // do undo
                setPrevCards(null)
            }
            setCanUndo(false)
        } else{
            // console.log("Please Click Rules for Undo Rules")
            active && removeHighlight(highlighted)
            setActive(false)
        }
        setTotalClick(totalClick+1);
    }

    const clickRemCards = () => {
        if (remCards > 0) {
            if (anyBlank(allCards)) {
                // new Audio(shuffleAudio).play()
                // set new remaining cards, request is holding remaining card click count
                const {
                    request: newRequest,
                    remCards: newRemCards
                } = clickGetCards(request, allCards, remCards)

                // if any selected card remove highlight
                if (active) {
                    setHighlighted({})
                    removeHighlight(highlighted)
                    setActive(false)
                }

                // set new variables
                setRequest(newRequest)
                setRemCards(newRemCards)
                setCanUndo(true)
                setUndoDistribute(true)
                CompleteControl()
                setTotalClick(totalClick - 5);
            }
            else{
                console.log("You must fill all columns for deal new cards")
            }
        }
        setTotalClick(totalClick+1);
    }

    const clickCard = (item, index) => () => {
        /* control the active variable, if active is true it means this is second click so need to check replacing
        but if false this means need to highlight or reject request */
        if (!active) {
            if (firstClick(item)) {
                const newHead = firstClick(item)
                const prevShow = getPrev(allCards, newHead)
                setActive(true)
                setHighlighted(newHead) // highlight clicked card
                // set previous card information for undo
                setPrevCards({
                    index,
                    newHead,
                    removeIndex: null,
                    status: prevShow
                })
                setCanUndo(false)
            }
        } else {
            // set prevcards index for undo
            setPrevCards({
                ...prevCards,
                removeIndex: index
            })

            // if placement success set undo control
            if(secondClick(item, highlighted, allCards, index)){
                setCanUndo(true)
                new Audio(flickAudio).play()
                setTotalClick(totalClick + 1);
            setTotalClick(totalClick-51); //bonus for successful click
            }
            setTotalClick(totalClick+1);
            setActive(false)
            setHighlighted({})
            CompleteControl()
            setUndoDistribute(false)
        }
    }

    const CompleteControl = () => {
        const { complete: newComplete  } = checkComplete(allCards, complete, true)
        newComplete !== complete && setCanUndo(false)
        setComplete(newComplete) // increase completed card value
    }

    return (
        // wrap cards with column and inside the columns add new cards to get 4 * 6, 6 * 5 card matrix
        // call cardholder and navbar components
        // if all decks completed redirect to finish page with stats
        complete < 8 ?
        <div>
            <Navbar clickUndo={clickUndo} clickHint={clickHint} complete={complete} handleTime={handleTime}
                    sendGameState={sendGameState} gameState={gameState} socket={socket} card_initial={card_initial} clickRestart={fakeClickRestart}/>

            <CardHolder clickRemCards={clickRemCards} remCards={remCards} complete={complete} />

            <div
            className="cards">
                { allCards.map((card, index) => (
                        <div className="cards-col">
                            { cardsPush(card, index, clickCard) }
                        </div>
                    ))
                }
            </div>

        </div> : <Redirect to={{
            pathname: "/finish",
            state: { time: time,
                    click: totalClick }
        }} />

    )
}

const activeCards = (allCards) => {
    let activeCards = [];
    for (let index = 0; index < 10; index++) {
        activeCards[index] = []
    }

    for (let index = 0; index < 10; index++) {
        let element = allCards[index]
        while (element.next !== null) {
            element = element.next
            if (element.val.show === true)
                activeCards[index].push({
                    'value': element.val['value'],
                    'deck': element.val['deck'],
                })
        }
    }
    return activeCards;
}

const fakeClickCard = (clickCard, action, allCards, setTriggerSecondClick) => {
    try {
        let [valueFrom, deckFrom, from, valueTo, to] = action; ///Action space represents value(1-13), deck (1-8), rowFrom (0-10), value (1-13), rowTo (1-10)

        let moveFrom = findLink(allCards, deckFrom, `${valueFrom}`);
        let moveFromIndex = findIndex(allCards, deckFrom, `${valueFrom}`);

        let active_cards = activeCards(allCards);
        let deckTo = active_cards[to][active_cards[to].length - 1]['deck'];
        let moveTo = findLink(allCards, deckTo, `${valueTo}`);
        let moveToIndex = findIndex(allCards, deckTo, `${valueTo}`);


        if (moveFrom === undefined || moveTo === undefined ||
            !moveFrom.val['show'] || !moveTo.val['show']) {
            return;
        }

        if (from !== moveFromIndex || to !== moveToIndex) {
            return;
        }

        const firstClick = clickCard(moveFrom, from);
        firstClick();

        setTriggerSecondClick({ trigger: true, to: to });
    }
    catch (e) {
        console.log("ERROR Could not find card", e);
    }
}

const fakeClickUndo = (clickUndo) => {
    clickUndo();
}

const fakeClickRemCards = (clickRemCards) => {
    clickRemCards();
}

const fakeClickRestart = () => {
    window.location.reload();
}

const findLink = (allCards, deck, value) => {
    try {
        for (let index = 0; index < allCards.length; index++) {
            let element = allCards[index];

            if (element === null) {
                continue
            }

            while (element.next!==null) {
                if (element.next.val['deck'] === deck && element.next.val['value'] === value)
                     return element.next
                element = element.next
            }
        }
    }
    catch (e) {
        console.log('Error while trying to find link:', e);
        return null;
    }
}

const findIndex = (allCards, deck, value) => {
    try {

        for (let index = 0; index < allCards.length; index++) {
            let element = allCards[index];

            if (element === null) {
                continue
            }

            while (element.next!==null) {
                if (element.next.val['deck'] === deck && element.next.val['value'] === value)
                     return index
                element = element.next
            }
        }
    }
    catch (e) {
        console.log('Error while trying to find link:', e);
        return -1;
    }
}

export default Game