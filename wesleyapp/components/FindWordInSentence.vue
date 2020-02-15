<template>
    <view class="container">
        <view class="word-to-find">
            <Word
                v-if="shouldShowTargetWord && showWord"
                ref="targetWordRef"
                :key="curSentence.targetWord + curSentence.sentence"
                :word="curSentence.targetWord"
                :wordPressed="() => {}"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :narrating="false"
                :continueSentence="()=>{}"
                :finishedAnimating="queuedCallback" />
        </view>
        <Sentence
            v-if="showSentence"
            ref="sentenceRef"
            :finish-narration="finishNarration"
            :sentence="curSentence.sentence"
            :word-pressed="wordPressed"
            :narrating="narrating"
            :setManuallyReading="setManuallyReading"
            :manuallyReading="manuallyReading"
            :tutorial="tutorial"
            :targetWord="curSentence.targetWord"
            :queuedCallback="queuedCallback" />
    </view>
</template>

<script>
import Sentence from './Sentence'
import Word from './Word'
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
        },
        sayLevelUp: {
            type: Function,
            required: true
        }
    },
    
    components: {
        Sentence,
        Word,
    },

    data () {
        return {
            narrating: false,
            curSentence: {sentence: "", targetWord: ""},
            manuallyReading: false,
            firstReading: true,
            tutorial: false,
            showSentence: false,
            showWord: false,
            firstSentence: true,
            sentencesRead: 0,
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

        // we read the sentence on easy and normal mode, but not hard
        shouldReadSentence () {
            return this.difficultyReading < difficulty.HARD
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

        // Move on to the next sentence/target word. This does the following in order:
        // Animates out the current sentence (and target word if on easy mode)
        // Loads the new image and sets it as the background
        // Reads the new target word (and displays it if in easy mode)
        // Displays the new sentence (and reads it if in easy/normal mode)
        async getNext () {
            this.queuedCallback = null
            await this.finishLevelUp()
            // after 4 sentences are read, go on to next activity
            if (this.sentencesRead >= 4) {
                this.randomActivity()
            }
            // still in this activity, go on to next sentence
            else {
                this.correctOnFirstTry = true
                // disable interaction
                this.manuallyReading = true
                this.narrating = true
                this.firstReading = true
                // hide these while we switch curSentence
                this.showSentence = false
                this.showWord = false
                // move on to next sentence/word
                this.curSentence = this.getNextWord()
                // show image and change background
                this.fadeNewBackground()
            }
        },

        fadeNewBackground () {
            this.changeBackground(this.curSentence.targetWord, () => {
                // new image is now displayed as background, animate in target word
                // prepare the callback for after animation finishes
                this.queuedCallback = () => {
                    // speak and highlight the word
                    if (this.shouldShowTargetWord) {
                        this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                    }
                    // just speak it
                    else {
                        this.afterSpeak({ word: this.curSentence.targetWord, callback: this.finishedTargetWord })
                    }
                }
                // initiate animation
                this.showWord = true
                // if were not in easy mode theres no animation so timeout 
                if (!this.shouldShowTargetWord) {
                    this.queuedCallback()
                }
            })
        },

        finishedTargetWord () {
            // callback to move on to reading the sentence after target word is read
            // The first time the word is read, move on to animating and reading sentence
            if (this.firstReading) {
                // Keep this true even if the target word tries to set it false
                this.manuallyReading = true
                // timeout is to pause between reading word and displaying sentence
                setTimeout( () => {
                    // prepare the callback for after animation finishes
                    this.queuedCallback = () => {
                        // now begin reading sentence
                        if (this.shouldReadSentence) {
                            this.$refs.sentenceRef.beginNarration()
                        }
                        // we're on hard mode and not reading the sentence, recall this function to finish
                        else {
                            this.finishedTargetWord()
                        }
                    }
                    // now animate in sentence
                    this.firstReading = false
                    this.showSentence = true
                }, 350)
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
        },

        // We finished reading/highlighting the sentence, now repeat the word to be found
        finishNarration () {
            // timeout is delay between reading sentence and reading target word again
            setTimeout( () => {
                // in easy mode we highlight the word as we read it
                if (this.shouldShowTargetWord) {
                    this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                }
                // in normal mode we just read it
                else {
                    this.afterSpeak({ word: this.curSentence.targetWord, callback: this.finishedTargetWord })
                }
            }, 350)
        },

        // User clicked a word, if they clicked the right one, move on to the next sentence
        async wordPressed (word) {
            if (word.toLowerCase() === this.curSentence.targetWord) {
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
                        this.sentencesRead ++
                        // next word/sentence
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
                    // animate out our sentence and word
                    this.$refs.sentenceRef.animateOut()
                    if (this.shouldShowTargetWord) {
                        this.$refs.targetWordRef.animateOut()
                    }
                    else {
                        // no word to animate so count it as done
                        this.callbackCount++
                    }
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
        position: absolute;
        top: 0;
        align-self: center;
        margin-top: 50
    }
</style>