import Vue from 'vue-native-core'
import Vuex from "vuex"
import tts from 'react-native-tts'
import wordList from './wordList'
import letterList from './letterList'
import { AsyncStorage } from 'react-native';
import allDefaultPictures from './allDefaultPictures'
import Sound  from 'react-native-sound'
Vue.use(Vuex)


export var difficulty = {
    VERY_EASY: 0,
    EASY: 1,
    MEDIUM: 2,
    HARD: 3
}

export default new Vuex.Store({
    state: {
        // maps picture names to files
        pictures: {},
        // Map where keys are target words and values objects that look like this: 
        // {
        //  total,
        //  right,
        //  wrong
        // }
        // persistant across sessions
        wordHistory: {},
        // how many theyve gotten right/wrong in a row
        // not persistant
        // split up by topic
        rightStreekReading: 0,
        wrongStreekReading: 0,
        rightStreekSpelling: 0,
        wrongStreekSpelling: 0,
        // user's current difficulty, can be adjusted automatically by updateData or manually in settings
        // persistant
        // split up by topic
        difficultyReading: difficulty.VERY_EASY,
        difficultySpelling: difficulty.VERY_EASY,
        // whether we can adjust difficulty automatically based on user performance
        // persistant
        allowAutoAdjust: true,
        // highlight speed of read words
        highlightSpeed: 56,
        // text to speech module
        textToSpeech: tts,
        // factor to multiply any dimensions to so that they scale with screen sizes
        sizeFactor: 1.0,
        // base values for sizes
        baseFontSize: 40,
        basePaddingSize: 30,
        baseFontSizeSmall: 20,
        basePaddingSizeSmall: 15,
        // the basic shape of all words in the app
        roundBox: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.8,
            shadowRadius: 5,
            borderRadius: 20,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            // Currently elevation (android shadows) causes a bug where text in the roundBox casts an anti-shadow, making 
            // look like its faintly white highlighted when the background is semi-transparent 
            //elevation: 5,
        },
        radiusSize: 20,
        previousWord: '',
        allowedTopics: 'reading spelling',
        curActivity: {
            name: 'home',
            topic: '',
        },

    },
    getters: {
        getPicture: state => name => state.pictures[name],
        getUserPictures: state => () => {
            let userPics = {}
            for (var index in state.pictures) {
                if (state.pictures[index].user) {
                    userPics[index] = state.pictures[index].source
                }
            }
            return userPics
        },
        getPictureNames: state => Object.keys(state.pictures),
        highlightSpeed: state => state.highlightSpeed,
        textToSpeech: state => state.textToSpeech,
        shadow: state => state.shadow,
        allowAutoAdjust: state => state.allowAutoAdjust,
        difficultyReading: state => state.difficultyReading,
        difficultySpelling: state => state.difficultySpelling,
        sizeFactor: state => state.sizeFactor,
        fontSize: state => state.baseFontSize * state.sizeFactor,
        paddingSize: state => state.basePaddingSize * state.sizeFactor,
        fontSizeSmall: state => state.baseFontSizeSmall * state.sizeFactor,
        paddingSizeSmall: state => state.basePaddingSizeSmall * state.sizeFactor,
        radiusSize: state => state.radiusSize,
        roundBox: state => state.roundBox,
        previousWord: state => state.previousWord,
        allowedTopics: state => state.allowedTopics,
        curActivity: state => state.curActivity,
        // used for saving app
        getUserData: state => {
            return {
                wordHistory: state.wordHistory,
                difficultyReading: state.difficultyReading,
                difficultySpelling: state.difficultySpelling,
                allowAutoAdjust: state.allowAutoAdjust,
                allowedTopics: state.allowedTopics
            }
        },

        // depending on the activity, the object returned will be different
        getNextWord: state => () => {
            let list
            let populateOptions = false
            if (state.curActivity.name === "findWordInSentence") {
                list = wordList
            }
            else if (state.curActivity.name === "speakWord") {
                list = wordList
            }
            else if (state.curActivity.name === "spellWord") {
                list = wordList
            }
            else if (state.curActivity.name === "findWordByPicture") {
                list = wordList
                populateOptions = true
            }
            else if (state.curActivity.name === "findLetterByAlliteration") {
                list = letterList
            }
            else if (state.curActivity.name === "findWordByLetter") {
                list = letterList
                populateOptions = true
            }

            if (state['wrongStreek' + state.curActivity.topic] >= 2) list = getEasyChoices(state, list)
            else if (state['rightStreek' + state.curActivity.topic] >= 2) list = getHardChoices(state, list)

            let nextWord = list[Math.floor(Math.random() * list.length)]
            // we never want to show the same word twice
            while (nextWord.targetWord === state.previousWord && list.length > 1) {
                nextWord = list[Math.floor(Math.random() * list.length)]
            }
            state.previousWord = nextWord.targetWord
            
            // populate options for findWordByPicture and findWordByLetter
            if (populateOptions) {
                // we can surmise which (fwbp or fwbl) we're getting options for via the nextWord object
                nextWord.allWords = getWordOptions(nextWord)
            }

            return nextWord
        },
    },
    mutations: {
        setPicture(state, {name, source, user}) {
            Vue.set(state.pictures, name, {name, source, user})
        },

        // used when loading app
        setUserData(state, data) {
            Vue.set(state, 'wordHistory', data.wordHistory)
            Vue.set(state, 'difficultySpelling', data.difficultySpelling)
            Vue.set(state, 'difficultyReading', data.difficultyReading)
            Vue.set(state, 'allowedTopics', data.allowedTopics)
            Vue.set(state, 'allowAutoAdjust', data.allowAutoAdjust)
        },

        setActivity(state, activity) {
            Vue.set(state, 'curActivity', activity)
        },

        setSizeFactor(state, size) {
            Vue.set(state, 'sizeFactor', size)
        },

        setDifficultyReading(state, value) {
            Vue.set(state, 'difficultyReading', value)
        },
        setDifficultySpelling(state, value) {
            Vue.set(state, 'difficultySpelling', value)
        },
        setAllowAutoAdjust(state, value) {
            Vue.set(state, 'allowAutoAdjust', value)
        },
        setAllowedTopics(state, value) {
            Vue.set(state, 'allowedTopics', value)
        },

    },
    actions: {
        // TODO we might be given a full sentence here, not just a word
        afterSpeak ({ getters }, { word, callback })  {
            var helper = () => {
                getters.textToSpeech.removeEventListener('tts-finish', helper)
                callback()
            }
            getters.textToSpeech.addEventListener('tts-finish', helper)
            getters.textToSpeech.getInitStatus().then(() => getters.textToSpeech.speak(word))  
        /*
            var sound = new Sound(String.toLowerCase(word) + '.wav', Sound.MAIN_BUNDLE, (error) => {
                if (error) {
                    console.log('failed to load sound: ' + word + '.wav', error)
                    return
                } 
                sound.play(callback)
            })
        */
        },

        // right is a boolean
        // REMEMBER this can update difficulty, do not call if you haven't cleaned up the screen yet
        updateData({ state }, { word, right, multiplier = 1 }) {
            let levelUp = false

            // make sure the word exists in our history
            if (!state.wordHistory[word]) {
                Vue.set(state.wordHistory, word, {
                    total: 0,
                    right: 0,
                    wrong: 0
                })
            }

            let rightStreek = 'rightStreek' + state.curActivity.topic
            let wrongStreek = 'wrongStreek' + state.curActivity.topic

            if (right) {
                Vue.set(state, rightStreek, state[rightStreek] + multiplier)
                Vue.set(state, wrongStreek, 0)
                Vue.set(state.wordHistory[word], 'total', state.wordHistory[word].total + 1)
                Vue.set(state.wordHistory[word], 'right', state.wordHistory[word].right + 1)
            }
            else {
                Vue.set(state, wrongStreek, state[wrongStreek] + multiplier)
                Vue.set(state, rightStreek, 0)
                Vue.set(state.wordHistory[word], 'total', state.wordHistory[word].total + 1)
                Vue.set(state.wordHistory[word], 'wrong', state.wordHistory[word].wrong + 1)
            }

            // Update difficulty
            if (state.allowAutoAdjust) {
                if (state[rightStreek] >= 4) {
                    Vue.set(state, rightStreek, 0)
                    increaseDifficulty(state)
                    levelUp = true
                }
                else if (state[wrongStreek] >= 4) {
                    Vue.set(state, wrongStreek, 0)
                    decreaseDifficulty(state)
                }
            }
            return levelUp
        },

        // slightly dangerous, we dont wait here to save. should be fine as long as we dont try to save two very fast
        savePicture({getters, commit}, {name, source}) {
            commit('setPicture', {name, source, user: true})
            let stringFile = JSON.stringify(getters.getUserPictures())
            AsyncStorage.setItem("WesleyApp-pictures", stringFile).then
        },

        loadPictures({commit, state}, savedPictures) {
            if (savedPictures) {
                savedPictures = JSON.parse(savedPictures)
                for (var savedName in savedPictures) {
                    commit('setPicture', {name: savedName, source: savedPictures[savedName], user: true})
                }
            }
            for (var name in allDefaultPictures) {
                if (!state.pictures[name]) {
                    commit('setPicture', {name, source: allDefaultPictures[name], user: false})
                }
            }
        },

        // if a picture fails to load, we reset to the default picture and save. 
        // slightly dangerous, we dont wait here to save. should be fine as long as we dont try to save two very fast
        invalidatePicture({commit, getters}, name) {
            commit('setPicture', {name, source: allDefaultPictures[name], user: false})
            let stringFile = JSON.stringify(getters.getUserPictures())
            AsyncStorage.setItem("WesleyApp-pictures", stringFile);
        },
    }
});



// ############ helper functions that aren't exposed by the store ###################

// topic is Reading or Spelling
function increaseDifficulty (state) {
    let variable = 'difficulty' + state.curActivity.topic
    Vue.set(state, variable, Math.min(difficulty.HARD, state[variable] + 1))
}

function decreaseDifficulty (state) {
    let variable = 'difficulty' + state.curActivity.topic
    Vue.set(state, variable, Math.max(difficulty.VERY_EASY, state[variable] - 1))
}

function getEasyChoices(state, list) {
    return getChoices(state, list, "right")
}

function getHardChoices(state, list) {
    return getChoices(state, list, "wrong")
}

function getChoices(state, list, rightWrong) {
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
            // we never want to show the same word twice
            if (i.targetWord == state.previousWord) continue

            let wordHistory = state.wordHistory[i.targetWord]
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


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function getWordOptions(nextWord) {
    let allWords = []
    // fwbl uses words/letterList, fwbp uses nextWord as is/wordList
    if (nextWord.words) {
        list = letterList
        allWords.push(nextWord.words[Math.floor(Math.random() * nextWord.words.length)])
    }
    else {
        list = wordList
        allWords.push(nextWord)
    }
    // now choose a random 3 more words from our given list (no duplicates)
    while (allWords.length < 4) {
        let randomWord = list[Math.floor(Math.random() * list.length)]
        // if we were given a letterList, we need to extract the word from the given letter's words
        if (randomWord.words) {
            randomWord = randomWord.words[Math.floor(Math.random() * randomWord.words.length)]
        }
        // this second part of the check is to make sure we dont add a word containing the target letter for fwbl
        // the !randomWord.includes part is to check to make sure we're looking at a string, not an object
        if (!allWords.includes(randomWord) && (!randomWord.includes || !randomWord.includes(nextWord.targetWord))) {
            allWords.push(randomWord)
        }
    }
    shuffle(allWords)
    return allWords
}