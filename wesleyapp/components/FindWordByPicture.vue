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
            <RepeatWord
                v-else-if="showTarget"
                :word="curWords.targetWord"
                ref="targetWordRef"
                :key="curWords.targetWord + curWords.allWords"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
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
            :queuedCallback="queuedCallback"
            :showPictures="!shouldShowPicture" />
    </view>
</template>

<script>
import Word from './Word'
import RepeatWord from './RepeatWord'
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
        defaultBackground: {
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
        Word,
        WordGrid,
        RepeatWord
    },

    data () {
        return {
            narrating: false,
            curWords: {targetWord: "", allWords: [{targetWord: ""}, {targetWord: ""}, {targetWord: ""}, {targetWord: ""}] },
            manuallyReading: false,
            firstReading: true,
            tutorial: false,
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
        if (this.difficultyReading < difficulty.HARD) {
            this.tutorial = true
        }
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
        
        // we show the target picture as the background on hard difficulty
        shouldShowPicture () {
            return this.difficultyReading > difficulty.MEDIUM
        },
        
        ...mapGetters([
            'difficultyReading',
            'getNextWord'
        ]),
    },

    methods: {
        ...mapMutations([
        ]),
        ...mapActions([
            'afterSpeak',
            'updateData',
            'finishLevelUp'
        ]),
        
        // Move on to the next target word. This does the following in order:
        // Animates out the current words/pictures (and target word if on easy mode)
        // Reads the new target word (and displays it if in easy mode)
        // Displays the new words/pictures (and reads them if on normal/easy)
        async getNext () {
            this.queuedCallback = null
            await this.finishLevelUp()
            // after 4 words are found, go on to next activity
            if (this.wordsFound >= 4) {
                this.randomActivity()
            }
            // still in this activity, go on to next word
            else {
                // incase the background changed during a level up, reset it
                if (!this.shouldShowPicture) this.defaultBackground()
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
                // show/read target word and begin animations
                this.queuedCallback = () => {}
                this.changeBackgroundPicture()
            }
        },

        changeBackgroundPicture () {
            if (this.shouldShowPicture) this.changeBackground(this.curWords.targetWord, this.startTargetWord)
            else this.startTargetWord()
        },

        startTargetWord () {
            // prepare the callback for after animation finishes
            callback = () => {
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

            // if were not in easy mode we dont wait for the speaker to finish showing
            if (!this.shouldShowTargetWord) {
                this.showTarget = true
                callback()
            }
            else {
                this.queuedCallback = callback
                this.showTarget = true
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
                    // set timeout to allow shrinking animation to finish
                    setTimeout(() => {
                        this.narrating = false
                        // normal mode needs this set explicitly
                        this.manuallyReading = false
                    }, 300)
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
        async wordPressed (word) {
            if (word.toLowerCase() === this.curWords.targetWord) {
                // set this to prevent the user from pressing buttons during transition
                this.narrating = true
                this.manuallyReading = true
                // prepare the callback for after animation finishes
                this.callbackCount = 0
                this.queuedCallback = async () => {
                    this.callbackCount++
                    if (this.callbackCount >= 2) {
                        let levelUp = await this.updateData({ word, right: this.correctOnFirstTry })
                        if (this.difficultyReading > difficulty.VERY_EASY) {
                            this.tutorial = false
                        }
                        this.showWord = false
                        this.wordsFound ++
                        // next word/grid
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
                    // play a pleasant sound before moving on
                    this.playRandomSound()
                    // animate out our word grid and target word
                    this.$refs.wordGrid.animateOut()
                    this.$refs.targetWordRef.animateOut()
                })
            }
            else {
                this.correctOnFirstTry = false
            }
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