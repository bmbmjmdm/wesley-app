import Vue from 'vue-native-core'
import Vuex from "vuex"
import tts from 'react-native-tts'
import fwisList from './fwisList'
import fwbpList from './fwbpList'
import swList from './swList'
import Sound  from 'react-native-sound'
Vue.use(Vuex)



export default new Vuex.Store({
    state: {
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
        rightStreek: 0,
        wrongStreek: 0,
        // user's current difficulty, can be adjusted automatically by updateData or manually in settings
        // persistant
        difficulty: "easy",
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

    },
    getters: {
        highlightSpeed: state => state.highlightSpeed,
        textToSpeech: state => state.textToSpeech,
        shadow: state => state.shadow,
        allowAutoAdjust: state => state.allowAutoAdjust,
        difficulty: state => state.difficulty,
        sizeFactor: state => state.sizeFactor,
        fontSize: state => state.baseFontSize * state.sizeFactor,
        paddingSize: state => state.basePaddingSize * state.sizeFactor,
        fontSizeSmall: state => state.baseFontSizeSmall * state.sizeFactor,
        paddingSizeSmall: state => state.basePaddingSizeSmall * state.sizeFactor,
        radiusSize: state => state.radiusSize,
        roundBox: state => state.roundBox,
        previousWord: state => previousWord,
        // used for saving app
        getUserData: state => {
            return {
                wordHistory: state.wordHistory,
                difficulty: state.difficulty,
                allowAutoAdjust: state.allowAutoAdjust
            }
        },

        // activities include
        // fwbp - find word by picture
        // fwis - find word in sentence
        // depending on the activity, the object returned will be different
        getNextWord: state => activity => {
            let list
            if (activity === "fwis") {
                list = fwisList
            }
            else if (activity === "fwbp") {
                list = fwbpList
            }
            else if (activity === "sw") {
                list = swList
            }

            if (state.wrongStreek >= 2) list = getEasyChoices(state, list)
            else if (state.rightStreek >= 2) list = getHardChoices(state, list)

            state.previousWord = list[Math.floor(Math.random() * list.length)]
            return state.previousWord
        },
    },
    mutations: {
        // used when loading app
        setUserData(state, data) {
            Vue.set(state, 'wordHistory', data.wordHistory)
            Vue.set(state, 'difficulty', data.difficulty)
            Vue.set(state, 'allowAutoAdjust', data.allowAutoAdjust)
        },

        setSizeFactor(state, size) {
            Vue.set(state, 'sizeFactor', size)
        },

        // right is a boolean
        // REMEMBER this can update difficulty, do not call if you haven't cleaned up the screen yet
        updateData(state, { word, right }) {
            // make sure the word exists in our history
            if (!state.wordHistory[word]) {
                Vue.set(state.wordHistory, word, {
                    total: 0,
                    right: 0,
                    wrong: 0
                })
            }

            if (right) {
                Vue.set(state, 'rightStreek', state.rightStreek + 1)
                Vue.set(state, 'wrongStreek', 0)
                Vue.set(state.wordHistory[word], 'total', state.wordHistory[word].total + 1)
                Vue.set(state.wordHistory[word], 'right', state.wordHistory[word].right + 1)
            }
            else {
                Vue.set(state, 'wrongStreek', state.wrongStreek + 1)
                Vue.set(state, 'rightStreek', 0)
                Vue.set(state.wordHistory[word], 'total', state.wordHistory[word].total + 1)
                Vue.set(state.wordHistory[word], 'wrong', state.wordHistory[word].wrong + 1)
            }

            // Update difficulty
            if (state.allowAutoAdjust) {
                if (state.rightStreek >= 8) {
                    Vue.set(state, 'rightStreek', 0)
                    increaseDifficulty(state)
                }
                else if (state.wrongStreek >= 5) {
                    Vue.set(state, 'wrongStreek', 0)
                    decreaseDifficulty(state)
                }
            }
        },

        setDifficulty(state, value) {
            Vue.set(state, 'difficulty', value)
        },
        setAllowAutoAdjust(state, value) {
            Vue.set(state, 'allowAutoAdjust', value)
        },

    },
    actions: {
        afterSpeak ({ getters }, { word, callback })  {
            var helper = () => {
                getters.textToSpeech.removeEventListener('tts-finish', helper)
                callback()
            }
            getters.textToSpeech.addEventListener('tts-finish', helper)
            getters.textToSpeech.getInitStatus().then(() => getters.textToSpeech.speak(word))
        },
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
});



// ############ helper functions that aren't exposed by the store ###################

function increaseDifficulty (state) {
    if (state.difficulty === "easy") {
        Vue.set(state, 'difficulty', "medium")
    }
    else if (state.difficulty === "medium") {
        Vue.set(state, 'difficulty', "hard")
    }
}

function decreaseDifficulty (state) {
    if (state.difficulty === "medium") {
        Vue.set(state, 'difficulty', "easy")
    }
    else if (state.difficulty === "hard") {
        Vue.set(state, 'difficulty', "medium")
    }
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