<template>
    <view class="container">
        <view class="one-third">
            <Word
                v-if="shouldShowWordNormal && showWord"
                ref="targetWordRef"
                :key="curWord.targetWord + 'word'"
                :word="curWord.targetWord"
                :wordPressed="() => {}"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :narrating="false"
                :continueSentence="()=>{}"
                :fadeAnimations="true"
                :finishedAnimating="queuedCallback" />
            <WordMadeOfLetters
                v-if="shouldShowWordMadeOfLetters && showWord"
                ref="targetWordRef"
                :key="curWord.targetWord + 'letters'"
                :finish-narration="finishedTargetWord"
                :word="curWord.targetWord"
                :narrating="false"
                :setManuallyReading="setManuallyReading"
                :letterPressed="() => {}"
                :manuallyReading="manuallyReading"
                :tutorial="false"
                :doneReading="finishedTargetWord"
                :fadeIn="true"
                :queuedCallback="queuedCallback" />
        </view>
        <view class="one-third">
            <WordMadeOfLetters
                ref="speltWordRef"
                :key="curWord.targetWord + 'spelt'"
                :finish-narration="finishLetterReading"
                :word="curWord.targetWord"
                :narrating="narrating"
                :setManuallyReading="setManuallyReading"
                :letterPressed="() => {}"
                :manuallyReading="manuallyReading"
                :tutorial="false"
                :doneReading="doneFinalReading"
                :startSplit="true"
                :transparent="true"
                :queuedCallback="queuedCallback" />
        </view>
        <view class="one-third">
            <WordMadeOfLetters 
                v-if="showLetters"
                ref="letterOptionsRef"
                :key="curWord.targetWord + 'options'"
                :finish-narration="()=>{}"
                :word="mixedLetters"
                :narrating="narrating"
                :setManuallyReading="setManuallyReading"
                :letterPressed="letterPressed"
                :manuallyReading="manuallyReading"
                :tutorial="tutorial1 || tutorial2"
                :targetLetter="curWord.targetWord.charAt(spellingLetter)"
                :doneReading="() => {}"
                :startSplit="true"
                :fadeIn="true"
                :queuedCallback="queuedCallback" />
        </view>
    </view>
</template>

<script>
import WordMadeOfLetters from './WordMadeOfLetters'
import Word from './Word'
import Letter from './Letter'
import Vue from 'vue-native-core'
import { difficulty } from './store'
import { mapGetters, mapMutations, mapActions } from 'vuex'

export default {
    props: {
        randomActivity: {
            type: Function,
            required: true
        },
        changeBackground: {
            type: Function,
            required: true
        },
        playRandomSound: {
            type: Function,
            required: true
        },
        sayGJ: {
            type: Function,
            required: true
        },
        sayLevelUp: {
            type: Function,
            required: true
        }
    },
    
    components: {
        Letter,
        Word,
        WordMadeOfLetters,
    },

    data () {
        return {
            narrating: false,
            curWord: {targetWord: ""},
            manuallyReading: false,
            tutorial1: true,
            tutorial2: true,
            showWord: false,
            showLetters: false,
            firstWord: true,
            wordsSpelt: 0,
            // represents the current letter they're spelling (index)
            spellingLetter: 0,
            correctOnFirstTry: true,
            queuedCallback: null, 
            callbackCount: 0,
        }
    },

    mounted () {
        this.getNext()
    },

    computed: {
        shouldShowWordNormal () {
            return this.difficultySpelling === difficulty.MEDIUM
        },

        shouldShowWordMadeOfLetters () {
            return this.difficultySpelling <= difficulty.EASY
        },

        mixedLetters () {
            let mixedWord = this.curWord.targetWord
            while (mixedWord === this.curWord.targetWord) {
                mixedWord = this.curWord.targetWord.split('').sort(function(){ return 0.5 - Math.random() }).join('')
            }
            return mixedWord
        },
        
        ...mapGetters([
            'difficultySpelling',
            'getNextWord'
        ]),
    },

    methods: {
        ...mapMutations([
        ]),
        ...mapActions([
            'afterSpeak',
            'updateData'
        ]),

        // Move on to the next word to spell. This does the following in order:
            // Animates out the current word
            // Loads the new image and sets it as the background
            // Reads the new target word (and displays it if in easy/medium mode)
            // Splits up the word into letters and reads each of them (if in easy mode)
            // Animates in the letter options
        getNext () {
            // after 4 sentences are read, go on to next activity
            if (this.wordsSpelt >= 2) {
                this.randomActivity()
            }
            // still in this activity, go on to next word
            else {
                this.correctOnFirstTry = true
                this.spellingLetter = 0
                // disable interaction
                this.manuallyReading = true
                this.narrating = true
                // hide these while we switch curWord
                this.showWord = false
                this.showLetters = false
                // move on to next word
                this.curWord = this.getNextWord()
                // show image and change background
                this.fadeNewBackground()
            }
        },

        fadeNewBackground () {
            this.changeBackground(this.curWord.targetWord, () => {
                // new image is now displayed as background, animate in target word
                // prepare the callback for after animation finishes
                this.queuedCallback = () => {
                    // speak and highlight the word
                    if (this.shouldShowWordNormal || this.shouldShowWordMadeOfLetters) {
                        this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                    }
                    // just speak it
                    else {
                        this.afterSpeak({ word: this.curWord.targetWord, callback: this.finishedTargetWord })
                    }
                }
                // initiate animation
                this.showWord = true
                // if were in hard mode theres no animation
                if (!(this.shouldShowWordNormal || this.shouldShowWordMadeOfLetters)) {
                    this.queuedCallback()
                }
            })
        },

        finishedTargetWord () {
            // callback after word is read and possibly split into letters
            if (this.narrating) {
                // Keep this true even if the target word tries to set it false
                this.manuallyReading = true
                // timeout is to pause between reading word and displaying letters
                setTimeout( () => {
                    // if we're in easy mode, split the word up
                    if (this.shouldShowWordMadeOfLetters) {
                        this.queuedCallback = this.showLetterOptions
                        Vue.nextTick(() => { this.$refs.targetWordRef.splitLetters() })
                    }
                    else {
                        this.showLetterOptions()
                    }
                }, 350)
            }
        },

        showLetterOptions() {
            // prepare the callback for after animation finishes
            this.queuedCallback = () => {
                if (this.shouldShowWordMadeOfLetters) {
                     this.$refs.targetWordRef.readLetter(this.spellingLetter, () => {
                        // set timeout to allow shrinking animation to finish
                        setTimeout(() => {
                            this.narrating = false
                            this.manuallyReading = false
                        }, 300)
                    })
                }
                else {
                    // We finished animating in the letter options, now let the user interact
                    this.narrating = false
                    this.manuallyReading = false
                }
            }
            // now animate in letters
            this.showLetters = true
        },

        // User clicked a letter, if they clicked the right one, move on to the letter
        letterPressed (letter, index) {
            if (letter === this.curWord.targetWord.charAt(this.spellingLetter)) {
                // set timeout to allow shrinking animation to finish
                setTimeout(() => {
                    // the user gets 2 letters of tutorial, then has to spell everything else on their own
                    if (this.tutorial1) {
                        this.tutorial1 = false
                    }
                    else {
                    if (this.difficultySpelling > difficulty.VERY_EASY) {
                        this.tutorial2 = false
                    }
                    }
                    // set this to prevent the user from pressing buttons during transition
                    this.narrating = true
                    this.manuallyReading = true
                    this.preventManualReadingChange = true
                    // play a pleasant sound and animate the chosen letter into position
                    this.$refs.letterOptionsRef.hideLetter(index)
                    this.$refs.speltWordRef.showLetter(this.spellingLetter)
                    this.playRandomSound((success) => {
                        // finished the sound and we assume we finished moving the letter
                        this.spellingLetter ++
                        if (this.spellingLetter === this.curWord.targetWord.length) {
                            // we finished the word
                            this.finishSpelling()
                        }
                        else {
                            // move on to the next letter
                            if (this.shouldShowWordMadeOfLetters) {
                                this.$refs.targetWordRef.readLetter(this.spellingLetter, () => {
                                    // set timeout to allow shrinking animation to finish
                                    setTimeout(() => {
                                        this.preventManualReadingChange = false
                                        this.narrating = false
                                        this.manuallyReading = false
                                    }, 300)
                                })
                            }
                            else {
                                this.preventManualReadingChange = false
                                this.narrating = false
                                this.manuallyReading = false
                            }
                        }
                    })
                }, 300)
            }
            else {
                this.correctOnFirstTry = false
            }
        },

        // the user finished spelling the word
        finishSpelling () {
            this.narrating = true
            this.manuallyReading = true
            // read all the letters the user selected
            this.$refs.speltWordRef.readLetters()
        },

        finishLetterReading () {
            // set timeout to allow shrinking animation to finish
            setTimeout(() => {
                // push the words together
                // ATM only joining the spelt word. if I do both it causes performance issues, though I could solve this by doing both words' animations in parallel here.
                // however now idk if i really wanna join both target and spelt words, so leaving as is
                //this.$refs.targetWordRef.joinLetters()
                this.queuedCallback = this.doneJoining
                Vue.nextTick(() => { this.$refs.speltWordRef.joinLetters() })
            }, 300)
        },

        doneJoining () {
            // read the word a final time
            this.$refs.speltWordRef.readWord(this.doneFinalReading)
        },

        async doneFinalReading () {
            // prepare the callback for after animation finishes
            this.callbackCount = 0
            this.queuedCallback = async () => {
                this.callbackCount++
                if (this.callbackCount >= 2) {
                    this.showWord = false
                    let levelUp = await this.updateData({ word: this.curWord.targetWord, right: this.correctOnFirstTry, multiplier: 2 })
                    this.wordsSpelt ++
                    // next word
                    if (levelUp) {
                        this.sayLevelUp(this.getNext)
                    }
                    else {
                        this.sayGJ(this.getNext)
                    }
                }
            }
            
            // next tick so everything picks up the queuedCallback
            Vue.nextTick(() => {
                // Then animate out the word to spell and the word we just made
                if (this.shouldShowWordNormal || this.shouldShowWordMadeOfLetters) {
                    this.$refs.targetWordRef.animateOut()
                }
                else {
                // target word isnt displayed so count it as done
                this.callbackCount++
                }
                this.$refs.speltWordRef.animateOut()
            })
        },

        setManuallyReading (val) {
            if (!this.narrating) {
                this.manuallyReading = val
            }
        },
    }


}
</script>


<style>
    .container {
        align-items: center;
        justify-content: center;
        flex: 1;
        flex-direction: column;
    }

    .one-third {
        flex: 1;
        align-items: center;
        justify-content: center
    }
</style>