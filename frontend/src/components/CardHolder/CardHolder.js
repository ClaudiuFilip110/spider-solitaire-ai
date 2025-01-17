import React from 'react'
import {
    blankWrap
} from '../../logic/ComponentCreate'
import '../../assets/css/cardholder.css'
import useWindowDimensions from '../../useWindowDimensions'

const cardholders = (clickRemCards, remCardCount, width2, timestamp) => {

    let marginValue = 0
    let cardHolderPush = []
    for (let index = 0; index < remCardCount; index++) {
        cardHolderPush.push(
            <div
            key={`cardholder-${index}=${timestamp}`} 
            style={{marginLeft: marginValue*( width2 > 910 ? 30 : 15),
            ...( width2 < 1150 ? {height: width2 > 910 ? 90 : 50,
                                        width: width2 > 910 ? 65 : 36} : "")}}
            className = "card cardholder"
            onClick = { clickRemCards } >
        </div>
        )
        marginValue += 1
    }
    return cardHolderPush
}

const CardHolder = ({clickRemCards, remCards, complete}) => {

    const { width } = useWindowDimensions();
    const timestamp = Date.now();  // Generate timestamp here


    return (
        <div className={"top" + (width < 640 ? " d-grid-row" : "")} >
            <div className="cardholders">
        {cardholders(clickRemCards, remCards ? remCards.length/10: 0, width, timestamp)}
        </div>

        <ul className = "blank-wrap" > 
        { blankWrap(complete) } 
        </ul>
        </div>
    )
}

export default CardHolder
