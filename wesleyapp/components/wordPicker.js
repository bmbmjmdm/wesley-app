import userData from './userData'
import fwisList from './fwisList'
import fwbpList from './fwbpList'

// activities include
// fwbp - find word by picture
// fwis - find word in sentence
// depending on the activity, the object returned will be different
export default function getNextWord (activity)  {
    let list
    if (activity === "fwis") {
        list = fwisList
    }
    else if (activity === "fwbp") {
        list = fwbpList
    }

    if (userData.wrongStreek >= 2) list = getEasyChoices(list)
    else if (userData.rightStreek >= 2) list = getHardChoices(list)

    return list[Math.floor(Math.random() * list.length)]
}

function getEasyChoices(list) {
    return getChoices(list, "right")
}

function getHardChoices(list) {
    return getChoices(list, "wrong")
}

function getChoices(list, rightWrong) {
    var newList = []
    
    // We're looking for words the user has had >= 75% success/failure answering in the past
    var threshold = 0.75

    // repeat until we have some options
    while (newList.length < 1) {
        // we don't have any easy/hard choices, return all
        if (threshold === 0) return list
        // keep track of highest ratio for performance
        let highest = 0

        // look through the whole list for words that pass the threshold
        for (var i of list) {
            let wordHistory = userData.wordHistory[i.targetWord]
            if (wordHistory) {
                let ratio
                if (wordHistory.total) {
                    ratio = wordHistory[rightWrong]/wordHistory.total
                }
                // if we have no data on the word, but we're looking for hard words,
                // assume the unseen word is a little hard
                else if (rightWrong === 'wrong') {
                    ratio = 0.5
                }
                else {
                    ratio = 0
                }
                if (ratio >= threshold) newList.push(i)
                else if (ratio > highest) highest = ratio
            }
        }

        // for every time we fail to find choices, we decrease the threshold
        // for performance, make sure the threshold is >= highest, so we only iterate the list twice at most
        while (threshold > highest) {
            threshold -= 0.25
        }
    }

    return newList
}