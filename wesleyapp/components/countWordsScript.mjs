
import wordList from './wordList.mjs'
import letterList from './letterList.mjs'

function lowercase(string) {
    var lower = string.toLowerCase()
    if (lower == 'i') {
        return 'I'
    }
    if (lower == 'i\'ve') {
        return "I've"
    }
    if (lower == 'i\'ll') {
        return "I'll"
    }
    if (lower == 'i\'d') {
        return "I'd"
    }
    if (lower == 'i\'m') {
        return "I'm"
    }
    return lower
}

//change wordList to be wordList.mjs
//change letterList to be letterList.mjs
//run with node, example:
//node --experimental-modules countWordsScript.mjs
//undo mjs change

var words = {
    'a': [],
    'b': [],
    'c': [],
    'd': [],
    'e': [],
    'f': [],
    'g': [],
    'h': [],
    'i': [],
    'j': [],
    'k': [],
    'l': [],
    'm': [],
    'n': [],
    'o': [],
    'p': [],
    'q': [],
    'r': [],
    's': [],
    't': [],
    'u': [],
    'v': [],
    'w': [],
    'y': [],
    'z': [],
}
var allWords = []

for (var word of wordList) {
    var sentenceWords = word.sentence.split(' ')
    for (var i of sentenceWords) {
        if (!allWords.includes(lowercase(i))) {
            allWords.push(lowercase(i))
        }
    }
}
for (var letter of letterList) {
    var alliterationWords = letter.alliteration.split(' ')
    for (var x of alliterationWords) {
        if (!allWords.includes(lowercase(x))) {
            allWords.push(lowercase(x))
        }
    }
}
for (var realWord of allWords) {
    console.log(realWord)
    words[realWord.charAt(0).toLowerCase()].push(realWord)
}

for (var index of letterList) {
    index.words = words[index.targetWord]
}

//save file
console.log(letterList)