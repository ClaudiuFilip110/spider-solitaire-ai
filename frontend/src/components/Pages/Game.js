import React, {useEffect, useState} from 'react'
import '../../assets/css/card.css'
import CardGenerator from '../../logic/CardGenerator'
import Navbar from '../Navbar/Navbar'
import {
    anyBlank,
    checkComplete,
    clickGetCards,
    firstClick,
    getCompleteHint,
    getHint,
    getPrev,
    removeCardOldPlace,
    removeHighlight,
    secondClick,
    undoDistribution,
    undoPlacement
} from '../../logic/Gameplay'
import {cardsPush} from '../../logic/ComponentCreate'
import CardHolder from '../CardHolder/CardHolder'
import {Redirect} from 'react-router-dom'
import {fakeClickCard, fakeClickRemCards, fakeClickRestart, fakeClickUndo, sendGameState} from "../../logic/AI";
import {activeCards, cardsInPlay} from "../../logic/linkedlist";

const Game = () => {
    let [allCards, setAllCards] = useState(null) // contains all cards
    let [remCards, setRemCards] = useState(null) // remaining cards

    const [highlighted, setHighlighted] = useState({}) // keeps highlighted card, set when every first click to card
    const [active, setActive] = useState(false) // active means we have highlighted card so if any click triggered need to control for placement
    const [request, setRequest] = useState(0) // request keeps how many deck of cards will come from remaining cards
    const [complete, setComplete] = useState(0) // complete keeps how many decks will completed
    const [prevCards, setPrevCards] = useState(null) // keep prev card for undo
    const [canUndo, setCanUndo] = useState(false) // undo control
    const [undoDistribute, setUndoDistribute] = useState(false) // undo after distribute new cards control
    const [totalClick, setTotalClick] = useState(0) // totalclick value for final score
    const [time, setTime] = useState(0) // hold time for display at final page
    const [socket, setSocket] = useState(null);
    const [foundHints, setFoundHints] = useState(getCompleteHint(allCards));
    const [gameState,
        setGameState] = useState({
        completedDecks: complete,
        cardsInPlay: cardsInPlay(allCards)
    });
    const [triggerSecondClick, setTriggerSecondClick] = useState({trigger: false, moveTo: null, to: null});
    const [shouldSendBack, setShouldSendBack] = useState(false);
    const [receivedAction, setReceivedAction] = useState(null);


    useEffect(() => {
        if (shouldSendBack) {
            sendGameState(gameState, socket);
            setShouldSendBack(false);
        }
    }, [shouldSendBack, gameState, socket]);

    useEffect(() => {
        setGameState({
            completedDecks: complete,
            cardsInPlay: cardsInPlay(allCards)
        });
    }, [complete, remCards, allCards]); // Dependencies

    useEffect(() => {
        if (receivedAction && allCards) {
            const action = receivedAction['action']
            const clicks = receivedAction['clicks']
            switch (action) {
                case -1:
                    break;
                case 0:
                    fakeClickCard(clickCard, clicks, allCards, setTriggerSecondClick);
                    break;
                case 1:
                    console.log('clicking undo')
                    fakeClickUndo(clickUndo);
                    break;
                case 2:
                    console.log('clicking new deck')
                    fakeClickRemCards(clickRemCards);
                    break;
                default:
                    console.log("SWITCH ERROR: Something went horribly wrong!!!!!")
            }
            // Reset receivedAction after processing
            setReceivedAction(null);
            setShouldSendBack(true);
        }
    }, [receivedAction, allCards])


    useEffect(() => {
        // Initialize WebSocket connection
        const newSocket = new WebSocket('ws://localhost:6789');
        setSocket(newSocket);

        newSocket.onopen = () => {
            console.log('WebSocket connected');
        };

        newSocket.onmessage = (event) => {
            let data = event.data;
            let action = null;
            try {
                let message = JSON.parse(data);
                action = message['action'];
                // console.log('ACTIVE CARDS', activeCards(allCards));
                if (action === -1) {
                    const {
                        card_initial,
                        card_rem
                    } = CardGenerator()
                    setAllCards(card_initial);
                    setRemCards(card_rem);
                    setComplete(0)
                }

                setReceivedAction(message);
            } catch (e) {
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
            if (triggerSecondClick.moveTo !== null) {
                // Call the second click function
                if (moveTo !== null) {
                    // console.log(triggerSecondClick.moveTo)
                    // console.log(`Trying to move item to row ${triggerSecondClick.to}`)
                    const secondClick = clickCard(triggerSecondClick.moveTo, triggerSecondClick.to);
                    secondClick();
                    setTriggerSecondClick({trigger: false, moveTo: null, to: null});
                } else {
                    console.log('moveTo is null')
                }
            } else {
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
                setCanUndo(true)
                setUndoDistribute(false)
                CompleteControl()
            } else {
                // if not eligible card remove highlight
                console.log("No Hint Found For This Card")
                removeHighlight(highlighted)
            }
            setActive(false)
        } else {
            // if there is no selected card search all cards for any hint
            let check = await getCompleteHint(allCards)
            check ? setTotalClick(totalClick) : console.log("No Hint Found")
        }
    }

    const clickUndo = () => {
        if (canUndo) {
            if (undoDistribute) {
                const prevRemCards = undoDistribution(allCards) // get distributed cards
                setRemCards([...prevRemCards, ...remCards]) // set remaining cards
                setUndoDistribute(false)
            } else {
                removeCardOldPlace(prevCards.newHead, allCards) // if last move not distribution undo last replacement
                undoPlacement(allCards, prevCards) // do undo
                setPrevCards(null)
            }
            setCanUndo(false)
        } else {
            // console.log("Please Click Rules for Undo Rules")
            active && removeHighlight(highlighted)
            setActive(false)
        }
    }

    const clickRemCards = () => {
        if (remCards.length > 0) {
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
            } else {
                console.log("You must fill all columns for deal new cards")
            }
        } else {
            console.log('you clicked rem cards, but there are still possible actions.')
        }
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
            if (secondClick(item, highlighted, allCards, index)) {
                setCanUndo(true)
            }
            setActive(false)
            setHighlighted({})
            CompleteControl()
            setUndoDistribute(false)
        }
    }

    const CompleteControl = () => {
        const {complete: newComplete} = checkComplete(allCards, complete, true)
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
                        sendGameState={sendGameState} gameState={gameState} socket={socket}
                        card_initial={allCards}/>

                <CardHolder clickRemCards={clickRemCards} remCards={remCards} complete={complete}/>

                <div
                    className="cards">
                    {allCards ? (
                        allCards.map((card, index) => (
                            <div className="cards-col" key={index}>
                                {cardsPush(card, index, clickCard)}
                            </div>
                        ))
                    ) : (
                        <div>Loading cards...</div> // Or any other placeholder you want to show
                    )}
                </div>

            </div> : <Redirect to={{
                pathname: "/finish",
                state: {
                    time: time,
                    click: totalClick
                }
            }}/>

    )
}

export default Game