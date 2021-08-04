import React from 'react'
import '../assets/css/card.css'
import CardTypeFinder from './CardTypeFinder'

const Card = ({item, index_val}) => {

    const cardType = CardTypeFinder({item})

    return (
        <div className={"card"} 
            style={{ 
            marginTop:((6-index_val)*20), 
            zIndex:6-index_val, 
            ...(index_val ===0 ? {background: (`var(${cardType})`), 
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat'} : {}), }}  >
        </div>
    )
}

export default Card