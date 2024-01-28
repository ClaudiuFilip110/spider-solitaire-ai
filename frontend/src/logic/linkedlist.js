export class Link {
    constructor(val) {
        this.val = val;
        this.next = null;
    }
}

// building linked list structure, cards will have next and val keys val contains card property, next have next card's property
function createLink(item) {
    let node, temp;
    for (let index = item.length - 1; index >= 0; index--) {
        if (!node)
            node = new Link(item[index]);
        else {
            temp = new Link(item[index]);
            temp.next = node;
            node = temp;
        }
    }
    return node;
}

const LinkedList = (array) => {

    let linkedlist = []

    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        linkedlist = [...linkedlist, createLink(element)]
    }

    return linkedlist
}

export const findLink = (allCards, deck, value) => {
    try {
        for (let index = 0; index < allCards.length; index++) {
            let element = allCards[index];

            if (element === null) {
                continue
            }

            while (element.next !== null) {
                if (element.next.val['deck'] === deck && element.next.val['value'] === value)
                    return element.next
                element = element.next
            }
        }
    } catch (e) {
        console.log('Error while trying to find link:', e);
        return null;
    }
}

export const findIndex = (allCards, deck, value) => {
    try {

        for (let index = 0; index < allCards.length; index++) {
            let element = allCards[index];

            if (element === null) {
                continue
            }

            while (element.next !== null) {
                if (element.next.val['deck'] === deck && element.next.val['value'] === value)
                    return index
                element = element.next
            }
        }
    } catch (e) {
        console.log('Error while trying to find link:', e);
        return -1;
    }
}

export const activeCards = (allCards) => {
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

export const cardsInPlay = (allCards) => {
    let activeCards = [];
    for (let index = 0; index < 10; index++) {
        activeCards[index] = []
    }

    if (allCards !== null)

        for (let index = 0; index < 10; index++) {
            let element = allCards[index]
            while (element.next !== null) {
                activeCards[index].push({
                    'value': element.val['value'],
                    'deck': element.val['deck'],
                    'show': element.val['show'],
                })
                element = element.next
            }
            if (element.val !== null)
                activeCards[index].push({
                    'value': element.val['value'],
                    'deck': element.val['deck'],
                    'show': element.val['show'],
                })
        }
    return activeCards;
}

export default LinkedList