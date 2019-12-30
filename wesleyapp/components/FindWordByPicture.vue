<template>
    <view class="container">
        <view class="word-to-find">
            <Word
                v-if="shouldShowTargetWord && showTarget"
                ref="targetWordRef"
                :key="curWords.targetWord + curWords.allWords"
                :word="curWords.targetWord"
                :wordPressed="() => {}"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :narrating="false"
                :continueSentence="()=>{}"
                :finishedAnimating="queuedCallback" />
        </view>
        <WordGrid
            v-if="showGrid"
            ref="wordGrid"
            :finish-narration="finishNarration"
            :words="curWords.allWords"
            :word-pressed="wordPressed"
            :narrating="narrating"
            :setManuallyReading="setManuallyReading"
            :manuallyReading="manuallyReading"
            :tutorial="tutorial"
            :targetWord="curWords.targetWord"
            :queuedCallback="queuedCallback" />
    </view>
</template>

<script>
import Word from './Word'
import WordGrid from './WordGrid'
import { difficulty } from './store'
import { mapGetters, mapMutations, mapActions } from 'vuex'
import Vue from 'vue-native-core'

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
        }
    },
    
    components: {
        Word,
        WordGrid
    },

    data () {
        return {
            narrating: false,
            curWords: {targetWord: "", allWords: [{targetWord: ""}, {targetWord: ""}, {targetWord: ""}, {targetWord: ""}] },
            manuallyReading: false,
            firstReading: true,
            tutorial: true,
            showGrid: false,
            showTarget: false,
            wordsFound: 0,
            needsWordRead: true,
            correctOnFirstTry: true,
            queuedCallback: null,
            callbackCount: 0,
        }
    },

    mounted () {
        this.getNext()
    },

    computed: {
        // we only show the target word on easy mode. we speak it on all modes
        shouldShowTargetWord () {
            return this.difficultyReading <= difficulty.EASY
        },

        // we read the options on easy and normal mode, but not hard
        shouldReadOptions () {
            return this.difficultyReading < difficulty.HARD
        },
        
        ...mapGetters([
            'difficultyReading',
            'getNextWord'
        ]),
    },

    methods: {
        ...mapMutations([
            'updateData'
        ]),
        ...mapActions([
            'afterSpeak'
        ]),
        
        // Move on to the next target word. This does the following in order:
        // Animates out the current words/pictures (and target word if on easy mode)
        // Reads the new target word (and displays it if in easy mode)
        // Displays the new words/pictures (and reads them if on normal/easy)
        getNext () {
            // after 4 words are found, go on to next activity
            if (this.wordsFound >= 4) {
                this.randomActivity()
            }
            // still in this activity, go on to next word
            else {
                this.correctOnFirstTry = true
                // disable interaction
                this.manuallyReading = true
                this.narrating = true
                this.firstReading = true
                // hide these while we switch curWords
                this.showGrid = false
                this.showTarget = false
                // move on to next word grid/target word
                this.curWords = this.getNextWord()
                // show image and change background
                this.fadeNewBackground()
            }
        },

        fadeNewBackground () {
            // no new background for this activity, moving 
            // prepare the callback for after animation finishes
            this.queuedCallback = () => {
                // speak and highlight the word
                if (this.shouldShowTargetWord) {
                    this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                }
                // we don't read the word here because:
                // its not easy mode so target word isnt displayed
                // the sentence hasnt been displayed yet
                // the background for this activity is generic, not the target word
                // due to the 3 above reasons, reading the word would be confusing. instead, we skip right to displaying the sentence
                else {
                    //afterSpeak(this.textToSpeech, this.curWords.targetWord, this.finishedTargetWord)
                    this.needsWordRead = true
                    this.finishedTargetWord("", 0)
                }
            }

            // animate in target word
            this.showTarget = true
            // if were in easy mode theres no animation
            if (!this.shouldShowTargetWord) {
                this.queuedCallback()
            }
        },

        finishedTargetWord (event, timeout = 350) {
            // if we already showed the grid we dont wait for it
            if (this.showGrid) {
                timeout = 0
            }
            // callback to move on to reading the word grid after target word is read
            if (this.narrating) {
                // The first time the word is read, move on to animating and reading word grid
                if (this.firstReading) {
                    // Keep this true even if the target word tries to set it false
                    this.manuallyReading = true
                    // timeout is to pause between reading word and displaying word grid
                    setTimeout( () => {
                        // prepare the callback for after animation finishes
                        this.queuedCallback = () => {
                            // we displayed and read the target word, so we can move on to reading the grid
                            if (this.shouldShowTargetWord) {
                                this.$refs.wordGrid.beginNarration()
                            }
                            // we didn't display the target word, which in this activity means we also didnt read it yet
                            // we need to read that first before doing anything
                            else if (this.needsWordRead) {
                                this.needsWordRead = false
                                this.firstReading = true
                                this.finishNarration()
                            }
                            // ok we read the word, now we can either read the options or finish
                            else {
                                if (this.shouldReadOptions) {
                                    this.$refs.wordGrid.beginNarration()
                                }
                                // we're on hard mode and not reading the options, recall this function to finish
                                else {
                                    this.finishedTargetWord()
                                }
                            }
                        }
                        // now animate in word grid
                        this.firstReading = false
                        if (!this.showGrid) this.showGrid = true
                        // we already animated it
                        else this.queuedCallback()
                    }, timeout)
                }
                // second time word is read, let the user interact now
                else {
                    this.narrating = false
                    // normal mode needs this set explicitly
                    this.manuallyReading = false
                }
            }
        },

        // We finished reading/highlighting the word grid, now repeat the word to be found
        finishNarration () {
            // timeout is delay between reading word grid and reading target word again
            setTimeout( () => {
                // in easy mode we highlight the word as we read it
                if (this.shouldShowTargetWord) {
                    this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                }
                // in normal mode we just read it
                else {
                    this.afterSpeak({ word: this.curWords.targetWord, callback: this.finishedTargetWord })
                }
            }, 350)
        },

        // User clicked a word, if they clicked the right one, move on to the next word
        wordPressed (word) {
            if (word.toLowerCase() === this.curWords.targetWord) {
                // set this to prevent the user from pressing buttons during transition
                this.narrating = true
                this.manuallyReading = true
                // play a pleasant sound before moving on
                this.playRandomSound(() => {
                    // prepare the callback for after animation finishes
                    this.callbackCount = 0
                    this.queuedCallback = () => {
                        this.callbackCount++
                        if (this.callbackCount >= 2) {
                            this.updateData({ word, right: this.correctOnFirstTry })
                            if (this.difficultyReading > difficulty.VERY_EASY) {
                                this.tutorial = false
                            }
                            this.showWord = false
                            this.wordsFound ++
                            // next word/grid
                            this.sayGJ(this.getNext)
                        }
                    }

                    // next tick so everything picks up the queuedCallback
                    Vue.nextTick(() => {
                        // animate out our word grid and target word
                        this.$refs.wordGrid.animateOut()
                        if (this.shouldShowTargetWord) {
                            this.$refs.targetWordRef.animateOut()
                        }
                        else {
                            // we're not animating word so count it as finished
                            this.callbackCount++
                        }
                    })
                })
            }
            else {
                this.correctOnFirstTry = false
            }
        },

        setManuallyReading (val) {
            this.manuallyReading = val
        },
    }


}
</script>


<style>
    .container {
        align-items: center;
        justify-content: center;
        flex: 1;
        flex-direction: row;
    }

    .word-to-find {
        align-self: center;
        position: absolute;
        z-index: 1
    }
    .full-image {
        height: 100%;
        width: 100%;
    }
</style>