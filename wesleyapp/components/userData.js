import Vue from 'vue-native-core'

var vueContainer = new Vue({
    data: {
        userData: {
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
            allowAutoAdjust: true
        }
    }
})

var userData = vueContainer.userData

export default userData

// right is a boolean
// REMEMBER this can update difficulty, do not call if you haven't cleaned up the screen yet
export function updateData(word, right) {
    // make sure the word exists in our history
    if (!userData.wordHistory[word]) userData.wordHistory[word] = {
        total: 0,
        right: 0,
        wrong: 0
    }

    if (right) {
        userData.rightStreek ++
        userData.wrongStreek = 0
        userData.wordHistory[word].total ++
        userData.wordHistory[word].right ++
    }
    else {
        userData.wrongStreek ++
        userData.rightStreek = 0
        userData.wordHistory[word].total ++
        userData.wordHistory[word].wrong ++
    }

    // Update difficulty
    if (userData.allowAutoAdjust) {
        if (userData.rightStreek >= 8) {
            userData.rightStreek = 0
            increaseDifficulty()
        }
        else if (userData.wrongStreek >= 5) {
            userData.wrongStreek = 0
            decreaseDifficulty()
        }
    }
}

export function setDifficulty(value) {
    Vue.set(userData, 'difficulty', value)
}

export function setAllowAutoAdjust(value) {
    Vue.set(userData, 'allowAutoAdjust', value)
}

function increaseDifficulty() {
    if (userData.difficulty === "easy") {
        Vue.set(userData, 'difficulty', "medium")
    }
    else if (userData.difficulty === "medium") {
        Vue.set(userData, 'difficulty', "hard")
    }
}

function decreaseDifficulty() {
    if (userData.difficulty === "medium") {
        Vue.set(userData, 'difficulty', "easy")
    }
    else if (userData.difficulty === "hard") {
        Vue.set(userData, 'difficulty', "medium")
    }
}