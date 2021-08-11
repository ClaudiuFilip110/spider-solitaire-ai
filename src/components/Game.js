import React, { useState } from 'react'
import '../assets/css/card.css'
import { useDrop } from 'react-dnd'
import CardTypeFinder from './CardTypeFinder'
import CardGenerator from '../CardGenerator'
import { useDrag } from 'react-dnd'

const CardCol = () => {

    const {
        card_initial,
        card_rem
    } = CardGenerator()

    const [allCards, setAllCards] = useState(card_initial) // contains all cards 
    const [ highlighted, setHighlighted ] = useState({}) // keeps highlighted card, set when every first click to card
    const [ active, setActive ] = useState(false) // active means we have highlighted card so if any click triggered need to control for placement
    const [ request, setRequest ] = useState(0) // request keeps how many deck of cards will come from remaining cards
    const [ remCards, setRemCards ] = useState(card_rem) // remaining cards
    const [ complete, setComplete ] = useState(0) // complete keeps how many decks will completed

    //const [_, forceUpdate] = useReducer((x) => x + 1, 0)

    const removeSelected = (remove) => {
        // remove selected item selected means after placement need to remove card from it's old position
     for (let index = 0; index < allCards.length; index++) {
            let element = allCards[index];
            let prev
            while (element !== null) {

                if (element === remove) {
                    prev === undefined ? allCards[index] = null : prev.next = null // control for if column will not have any cards after placement
                }
                 prev = element
                 element = element.next
            }
        }   
    }

    const removeHighlight = (remove) => {
        // remove highlighted card or cards
     for (let index = 0; index < allCards.length; index++) {
            let element = allCards[index];
            while (element !== null) {
                if (element === remove) {
                    element.val.active = false
                    remove = remove.next
                }
                element = element.next
            }
        }   
    }

    const setCards = (item, next) => {
        // set cards for new placement
        for (let index = 0; index < allCards.length; index++) {
            let element = allCards[index];
            while (element !== null) {
                let prev
                if (element === item) {
                    element.next = next
                }
                if (element === next) {
                    prev = null
                }
                prev = element
                element = element.next
            }
        } 
    }

    const setCardDisplay = () => {
        // traverse every card and set displayness to true if it's first element 
        for (let index = 0; index < 10; index++) {
            let element = allCards[index]
            while(element !== null && element.next !== null) {
                element = element.next
            }
        if (element!==null) {
            element.val.show = true;
        } 
        }
    }

    const createLinked = (element) => {
        // remaining cards is array of objects but we need to transform every object to linked list object
        class Link {
            constructor(val) {
                this.val = val
                this.next = null
            }
        }

        return new Link(element)
    }

    const clickGetCards = (e) => {
        // check request bcs only 5 * 10 cards will distribute
        if (request < 5) {
            setRequest(request + 1)
            // add new cards to placing cards
            for (let index = 0; index < allCards.length; index++) {
                let element = allCards[index];
                if (element === null) { // placing to empty columns
                    element = createLinked(remCards.shift())
                    allCards[index] = element
                }
                else {
                    while (element.next !== null) {
                        element = element.next
                    }
                    element.next = createLinked(remCards.shift())
                }
                setRemCards(remCards) // update remaining cards
            }
            setCardDisplay() // set displayness
        } else{
            alert("no card left")
        }
        
    }

    const checkComplete = () => {
        // traverse in every card and if rank reaches 13 means sorting complete
        for (let index = 0; index < allCards.length; index++) {
            let element = allCards[index];
            let rank = 1
            while (element !== null && element.next !== null) {
                if (element.val.show === true) {
                    if ((+element.next.val.value + 1) === +element.val.value) {
                        if (rank === 1) {
                            var node = element // hold head node bcs if sorting complete, we will need to remove from that index
                        }
                       rank += 1
                       if (rank === 13) {
                           removeSelected(node) // remove whole completed deck
                           setComplete(complete + 1) // increase completed card value 
                       }
                    }
                    else rank = 1 // reset rank value for new deck
                }
                element = element.next
            }
        }
        if (complete === 8) {
            alert("congratulations")
        }
    }
    
    const handleClick = (item) => (e) => {
        /* control the active variable, if active is true it means this is second click so need to check replacing
        but if false this means need to highlight or reject request */
        if (!active) {
        
        let iter = 0; // how many cards will be select
        let head = item; // need to hold head node because after control item's next, clicked item will be lost
        
        while(item.next !== null){
            
            let next_value = +item.next.val.value + 1;
            let cur_value = +item.val.value;
            // check cards if in correct order
            if(next_value !== cur_value ) {
                return false
            }

            item = item.next
            iter += 1
        }
        setHighlighted(head) // highlight selected card
        // if every item under clicked item, activate all
        for (let index = 0; index <= iter; index++) {
            head.val.active = true
            head = head.next
        }
        setActive(true) // we have activated item
        } else{

            if (+item.val.value === +highlighted.val.value + 1 || item === null) { // check clicked item is correct for placing highlighted
            removeSelected(highlighted) // remove card from old place
            setCards(item, highlighted) // set cards accordingly
            // remove card's activation
            while (item !== null) {
                item.val.active = false
                item = item.next
            }
            }
            else{
                // if not correct feedback to user and remove highlight
                alert("you cannot my friend")
                removeHighlight(highlighted)
            }
            // reset variables for new processes, check if any completed decks, set card's display based on new indexes
            setActive(false) 
            setHighlighted({})
            checkComplete()
            setCardDisplay()
        }
    }

    const cardsPush = (card, index) => {
        let pushed =[]
        let marginValue = 0 // for placing cards

        while (card !== null) {
        let id = card.val.value + " " + card.val.deck // calculate each cards spesific id
        const cardType = CardTypeFinder(card) // get correct image for card's value

        // pushed array contains each card div
        pushed.push(
            
            <div
            id={id}
            className = {
                "card " + (card.val.active ? 'selectedCard' : '') // if card's active property true, highlight to card
            }
            onClick = {
                handleClick(card)
            }
            style={{ 
            marginTop:(marginValue*20), 
            ...(card.val.show ? { // if card's show property true, display the card 
                    background: (`var(${cardType})`),
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat'} : ""), }}  >
        </div>
        
        )
        card = card.next
        marginValue += 1
    }
    return pushed
    }
    
    return (
        // wrap cards with column and inside the columns add new cards to get 4 * 6, 6 * 5 card matrix
        <div 
        className="cards">
            {
                allCards.map((card, index) => (
                    <div className="cards-col"> 
                        {
                            cardsPush(card, index)
                        }
                    </div>
                ))

            }
            <div className = "card cardholder"
                onClick = {clickGetCards} >
                </div>
        </div>
    )
}

export default CardCol