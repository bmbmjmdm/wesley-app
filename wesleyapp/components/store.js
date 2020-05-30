import Vue from 'vue-native-core'
import Vuex from "vuex"
import tts from 'react-native-tts'
import wordList from './wordList'
import allWordsText from './allWords'
import letterList from './letterList'
import additionalRecordingsList from './additionalRecordingsList'
import { AsyncStorage } from 'react-native';
import allDefaultPictures from './allDefaultPictures'
import Sound  from 'react-native-sound'
import {AudioUtils} from 'react-native-audio'
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
        // maps recording names to files
        recordings: {},

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
        radiusSize: 20,
        previousWord: '',
        allowedTopics: 'reading spelling',
        curActivity: {
            name: 'home',
            topic: '',
        },
        showIntro: true,
        showRecordIntro: true,
        showOptionsIntro: true,
        showPersonalizeIntro: true,
        adjustLevel: 0,
        allWordsSaid: allWordsText.split("\n"),
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
        hasUserPicture: state => (word) => state.pictures[word] && state.pictures[word].user,
        hasAnyUserPicture: state => {
            for (var index in state.pictures) {
                if (state.pictures[index].user) {
                    return true
                }
            }
        },
        getPictureNames: state => Object.keys(state.pictures),
        getRecording: state => name => state.recordings[name],
        getUserRecordings: state => () => {
            let userRecs = {}
            for (var index in state.recordings) {
                if (state.recordings[index].user) {
                    userRecs[index] = {
                        startTime: state.recordings[index].startTime,
                        recordingLength: state.recordings[index].recordingLength
                    }
                }
            }
            return userRecs
        },
        hasUserRecording: state => (word) => {
            let properWord = word.toLowerCase().replace("'", "")
            return state.recordings[properWord] && state.recordings[properWord].user
        },
        hasAnyUserRecording: state => {
            for (var index in state.recordings) {
                if (state.recordings[index].user) {
                    return true
                }
            }
        },
        getLetterNames: state => letterList.map(letter => letter.targetWord),
        getRecordingNames: state => additionalRecordingsList.map(recording => recording.targetWord),
        highlightSpeed: (state, getters) => (word) => {
            let cleanWord = word.toLowerCase().replace("'", "")
            if (getters.hasUserRecording(cleanWord)) {
                let recording = getters.getRecording(cleanWord)
                return 2.5 * recording.recordingLength * state.highlightSpeed
            }
            else return state.highlightSpeed
        },
        textToSpeech: state => state.textToSpeech,
        shadow: state => state.shadow,
        difficultyReading: state => state.difficultyReading,
        difficultySpelling: state => state.difficultySpelling,
        sizeFactor: state => state.sizeFactor,
        fontSize: state => Math.round(state.baseFontSize * state.sizeFactor),
        paddingSize: state => Math.round(state.basePaddingSize * state.sizeFactor),
        fontSizeSmall: state => Math.round(state.baseFontSizeSmall * state.sizeFactor),
        paddingSizeSmall: state => Math.round(state.basePaddingSizeSmall * state.sizeFactor),
        radiusSize: state => state.radiusSize * state.sizeFactor,
        // the basic shape of all words in the app
        roundBox: state => { return {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.8,
            shadowRadius: 5,
            borderRadius: 20 * state.sizeFactor,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            // Currently elevation (android shadows) causes a bug where text in the roundBox casts an anti-shadow, making 
            // look like its faintly white highlighted when the background is semi-transparent 
            //elevation: 5,
        } },
        previousWord: state => state.previousWord,
        allowedTopics: state => state.allowedTopics,
        curActivity: state => state.curActivity,
        showIntro: state => state.showIntro,
        showRecordIntro: state => state.showRecordIntro,
        showOptionsIntro: state => state.showOptionsIntro,
        showPersonalizeIntro: state => state.showPersonalizeIntro,
        // used for saving app
        getUserData: state => {
            return {
                wordHistory: state.wordHistory,
                difficultyReading: state.difficultyReading,
                difficultySpelling: state.difficultySpelling,
                allowedTopics: state.allowedTopics,
                showIntro: state.showIntro,
                showRecordIntro: state.showRecordIntro,
                showPersonalizeIntro: state.showPersonalizeIntro,
                showOptionsIntro: state.showOptionsIntro
            }
        },
        getWordOrLetter: state => (word) => {
            return letterList.concat(wordList).concat(additionalRecordingsList).find(element => element.targetWord === word)
        },
        getAllWordsToRecord: (state, getters) => () => {
            let fullList = additionalRecordingsList.concat(wordList).concat(letterList)
            let finalList = new Set()
            // look at all words/letters/phrases we have
            for (let wordObj of fullList) {
                // grab the actual sentence/alliteration/phrase associated with the word/letter/phrase
                let sentence = wordObj.sentence || wordObj.alliteration
                if (sentence) {
                    // append the letter if its a letter we're looking at
                    if (wordObj.alliteration) {
                        sentence = wordObj.targetWord + " " + sentence
                    }
                    sentence = sentence.split(' ')
                    // look at each word in that sentence/alliteration/phrase
                    for (let wordString of sentence) {
                        // clean it up so we can see if we already have a recording for it
                        let cleanWord = wordString.toLowerCase().replace("'", "")
                        if (!getters.hasUserRecording(cleanWord)) {
                            // if not add it to our set. we want it to be lowercase so we dont get duplicates due to
                            // case, however not if the word should never be lowercase like "I"
                            let readableWord = cleanWord === 'i' || cleanWord === 'im' || cleanWord === 'ive' ? wordString : wordString.toLowerCase()
                            finalList.add(readableWord)
                        }
                    }
                }
            }
            return Array.from(finalList)            
        },
        getAllWordsNeedingPictures: (state, getters) => () => {
            let finalList = []
            for (let word of getters.getPictureNames) {
                if (!getters.hasUserPicture(word)) {
                    finalList.push(word)
                }
            }
            return finalList          
        },

        // depending on the activity, the object returned will be different
        getNextWord: state => () => {
            let list
            let populateOptions = false
            let letterLimit = 999
            if (state.curActivity.name === "findWordInSentence") {
                list = wordList
            }
            else if (state.curActivity.name === "speakWord") {
                list = wordList
            }
            else if (state.curActivity.name === "spellWord") {
                list = wordList
                letterLimit = 10
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

            if (state['wrongStreek' + state.curActivity.topic] >= 2) list = getEasyChoices(state, list, letterLimit)
            else if (state['rightStreek' + state.curActivity.topic] >= 2) list = getHardChoices(state, list, letterLimit)

            let nextWord = list[Math.floor(Math.random() * list.length)]
            // we never want to show the same word twice
            while ((nextWord.targetWord === state.previousWord || nextWord.targetWord.length > letterLimit) && list.length > 1) {
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
        setRecording(state, {name, user, startTime, recordingLength}) {
            Vue.set(state.recordings, name, {name, user, startTime, recordingLength})
        },
        deleteRecording(state, name) {
            Vue.delete(state.recordings, name)
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
        setAllowedTopics(state, value) {
            Vue.set(state, 'allowedTopics', value)
        },

        finishIntro(state) {
            Vue.set(state, 'showIntro', false)
        },
        finishRecordIntro (state) {
            Vue.set(state, 'showRecordIntro', false)
        },
        finishOptionsIntro (state) {
            Vue.set(state, 'showOptionsIntro', false)
        },
        finishPersonalizeIntro (state) {
            Vue.set(state, 'showPersonalizeIntro', false)
        },

    },
    actions: {
        // the proper way to use afterSpeak with a full sentence
        afterSpeakSentence ({ getters, dispatch }, { sentence, callback = () => {} }) {
            // we're done
            if (!sentence) callback()
            // last word
            else if (sentence.indexOf(' ') === -1) {
                dispatch('afterSpeak', { word: sentence, callback })
            }
            // still have a sentence
            else {
                let firstWord = sentence.substring(0, sentence.indexOf(' '))
                let restSentence = sentence.substring(sentence.indexOf(' ') + 1)
                // recursive call
                dispatch('afterSpeak', {
                    word: firstWord,
                    callback: () => {
                        dispatch('afterSpeakSentence', { sentence: restSentence, callback })
                    }}
                )
            }
        },

        // heads up we might be given a full sentence here, not just a word. You should use afterSpeakSentence if you want to read a sentence
        afterSpeak ({ getters, dispatch }, { word, callback = () => {} })  {
            // setup the helper for tts just incase
            var helper = () => {
                getters.textToSpeech.removeEventListener('tts-finish', helper)
                if (callback) callback()
            }
            let cleanWord = word.toLowerCase().replace("'", "")
            let hasRecording = getters.hasUserRecording(cleanWord)

            //no recording, use tts
            if (!hasRecording) {
                getters.textToSpeech.addEventListener('tts-finish', helper)
                getters.textToSpeech.getInitStatus().then(() => getters.textToSpeech.speak(word.toLowerCase()))
            }
            // load from the users recordings
            else {
                var sound = new Sound(cleanWord + '.aac', AudioUtils.DocumentDirectoryPath, (error) => {
                    // we have a good sound
                    if (!error) {
                        // Set the recording to start at 0.3 second before we heard the user start speaking
                        sound.setCurrentTime(Math.max(getters.getRecording(cleanWord).startTime - 0.3, 0))
                        sound.play(() => {
                            sound.release()
                            if (callback) callback()   
                        })
                    }
                    // error
                    else {
                        // delete the recording and use tts instead
                        console.log('failed to load sound: ' + cleanWord + '.aac', error)
                        dispatch('invalidateRecording', cleanWord)
                        getters.textToSpeech.addEventListener('tts-finish', helper)
                        getters.textToSpeech.getInitStatus().then(() => getters.textToSpeech.speak(word.toLowerCase()))
                    }
                })
            }
        },

        // right is a boolean
        // this does not actually adjust the level. It used to, but now it just tells if you the level WILL increase
        // to complete the level up/down, call finishLevelUp
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
            if (state[rightStreek] >= 4) {
                Vue.set(state, rightStreek, 0)
                state.adjustLevel = 1
                levelUp = true
            }
            else if (state[wrongStreek] >= 4) {
                Vue.set(state, wrongStreek, 0)
                state.adjustLevel = -1
            }
            return levelUp
        },

        finishLevelUp ({ state }) {
            if (state.adjustLevel > 0) {
                state.adjustLevel = 0
                increaseDifficulty(state)
            }
            else if (state.adjustLevel < 0) {
                state.adjustLevel = 0
                decreaseDifficulty(state)
            }
        },

        savePicture({getters, commit}, {name, source}) {
            commit('setPicture', {name, source, user: true})
        },

        saveRecordings({getters, commit}, {audioDetails}) {
            for (let obj of audioDetails) {
                if (!obj.word) continue
                commit('setRecording', {
                    name: obj.word, 
                    user: true, 
                    startTime: obj.startTime, 
                    recordingLength: obj.recordingLength
                })
            }
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

        loadRecordings({commit, state}, savedRecordings) {
            if (savedRecordings) {
                savedRecordings = JSON.parse(savedRecordings)
                for (var recording in savedRecordings) {
                    commit('setRecording', {
                        name: recording, 
                        user: true, 
                        startTime: savedRecordings[recording].startTime, 
                        recordingLength: savedRecordings[recording].recordingLength
                    })
                }
            }/*
            for (var name in state.allWordsSaid) {
                if (!state.recordings[name]) {
                    commit('setRecording', {name, user: false, startTime: 0})
                }
            }*/
        },

        // used when loading app
        async setUserData({dispatch, state}, { data }) {
            if (data) {
                Vue.set(state, 'wordHistory', data.wordHistory)
                Vue.set(state, 'difficultySpelling', data.difficultySpelling)
                Vue.set(state, 'difficultyReading', data.difficultyReading)
                Vue.set(state, 'allowedTopics', data.allowedTopics)
                Vue.set(state, 'showIntro', data.showIntro)
                Vue.set(state, 'showRecordIntro', data.showRecordIntro)
                Vue.set(state, 'showOptionsIntro', data.showOptionsIntro)
                Vue.set(state, 'showPersonalizeIntro', data.showPersonalizeIntro)
            }
        
            let pictures = await AsyncStorage.getItem("WesleyApp-pictures")
            let recordings = await AsyncStorage.getItem("WesleyApp-recordings")
            let loadRecordingsPromise = dispatch('loadRecordings', recordings)
            let loadPicturesPromise = dispatch('loadPictures', pictures)
            await loadRecordingsPromise
            await loadPicturesPromise
        },

        // if a picture fails to load, we reset to the default picture and save. 
        invalidatePicture({commit, getters}, name) {
            commit('setPicture', {name, source: allDefaultPictures[name], user: false})
        },

        // if a recording fails to load, we reset to the default recording and save. 
        invalidateRecording({commit, getters}, name) {
            name = name.toLowerCase().replace("'", "")
            commit('deleteRecording', name)
        },

        async invalidateAllPictures({commit, getters, dispatch}) {
            for (var name in getters.getUserPictures()) {
                await dispatch('invalidatePicture', name)
            }
        },

        async invalidateAllRecordings({commit, getters, dispatch}) {
            for (var name in getters.getUserRecordings()) {
                await dispatch('invalidateRecording', name)
            }
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

function getEasyChoices(state, list, letterLimit) {
    return getChoices(state, list, "right", letterLimit)
}

function getHardChoices(state, list, letterLimit) {
    return getChoices(state, list, "wrong", letterLimit)
}

function getChoices(state, list, rightWrong, letterLimit) {
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
            if (i.targetWord.length > letterLimit) continue

            let wordHistory = state.wordHistory[i.targetWord]
            if (wordHistory) {
                let ratio
                if (wordHistory.total) {
                    ratio = wordHistory[rightWrong]/wordHistory.total
                }
                // if we have no data on the word, but we're looking for hard words,
                // assume the unseen word is hard
                else if (rightWrong === 'wrong') {
                    ratio = 0.75
                }
                // otherwise assume the word is a little easy
                else {
                    ratio = 0.25
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
    let list
    let targetWord
    // fwbl uses words/letterList
    if (nextWord.words) {
        list = letterList
        let wordStartingWithLetter
        // we dont want 1-leter words
        do {
            wordStartingWithLetter = nextWord.words[Math.floor(Math.random() * nextWord.words.length)]
        }
        while (wordStartingWithLetter.length === 1)
        targetWord = wordStartingWithLetter
    }
    //fwbp uses nextWord as is/wordList
    else {
        list = wordList
        targetWord = nextWord
    }
    allWords.push(targetWord)
    // now choose a random 3 more words from our given list (no duplicates)
    while (allWords.length < 4) {
        let randomWord = list[Math.floor(Math.random() * list.length)]
        // if we were given a letterList, we need to extract the word from the given letter's words
        if (randomWord.words) {
            let randomWordSelected
            // we dont want 1-leter words
            do {
                randomWordSelected = randomWord.words[Math.floor(Math.random() * randomWord.words.length)]
            }
            while (randomWordSelected.length === 1)
            randomWord = randomWordSelected
        }
        // the second part of this check is to make sure we dont add a word containing the target letter for fwbl
        // the !randomWord.includes part is to check to make sure we're looking at a string, not an object
        if (!allWords.includes(randomWord) && (!randomWord.includes || !randomWord.toLowerCase().includes(nextWord.targetWord))) {
            allWords.push(randomWord)
        }
        
        if (allWords.length === 4) {
            shuffle(allWords)
            // now time for a wierd check. fwbp cannot have 2 side-by-side words that exceed 15 total characters (due to screen limitations)
            // so we need to check the firstWord.length + secondWord.length as well as thirdWord.length + fourthWord.length to see if either of these exceed 15
            // again, !randomWord.includes tells us we're doing fwbp
            if (!randomWord.includes) {
                let firstLineLength = allWords[0].targetWord.length + allWords[1].targetWord.length
                let secondLineLength = allWords[2].targetWord.length + allWords[3].targetWord.length
                if (secondLineLength > 15 || firstLineLength > 15) {
                    allWords = [targetWord]
                }
            }
        }
    }
    return allWords
}