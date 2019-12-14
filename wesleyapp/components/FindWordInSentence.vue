<template>
    <view class="container">
        <view class="word-to-find">
            <Word
                v-if="shouldShowTargetWord && showWord"
                ref="targetWordRef"
                :key="curSentence.targetWord + curSentence.sentence"
                :word="curSentence.targetWord"
                :wordPressed="finishedTargetWord"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :narrating="false"
                :continueSentence="()=>{}" />
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
            :targetWord="curSentence.targetWord" />
    </view>
</template>

<script>
import Sentence from './Sentence'
import Word from './Word'
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
        }
    },
    
    components: {
        Sentence,
        Word,
    },

    data () {
        return {
            narrating: false,
            curSentence: {sentence: "", targetWord: "", pic: null},
            manuallyReading: false,
            firstReading: true,
            tutorial: true,
            showSentence: false,
            showWord: false,
            firstSentence: true,
            sentencesRead: 0,
            correctOnFirstTry: true
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
            'updateData'
        ]),
        ...mapActions([
            'afterSpeak'
        ]),

        // Move on to the next sentence/target word. This does the following in order:
        // Animates out the current sentence (and target word if on easy mode)
        // Loads the new image and sets it as the background
        // Reads the new target word (and displays it if in easy mode)
        // Displays the new sentence (and reads it if in easy/normal mode)
        getNext () {
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
            this.changeBackground(this.curSentence.pic, () => {
                // new image is now displayed as background, animate in target word
                this.showWord = true
                var wordAnimateTime = 700
                if (!this.shouldShowTargetWord) {
                    wordAnimateTime = 0
                }
                // timeout is to allow word animation to finish
                // if were not in easy mode theres no animation so timeout time is 0
                setTimeout(() => {
                    // speak and highlight the word
                    if (this.shouldShowTargetWord) {
                        this.$refs.targetWordRef.readWord()
                    }
                    // just speak it
                    else {
                        this.afterSpeak({ word: this.curSentence.targetWord, callback: this.finishedTargetWord })
                    }
                }, wordAnimateTime)
            })
        },

        finishedTargetWord () {
            // callback to move on to reading the sentence after target word is read
            if (this.narrating) {
                // The first time the word is read, move on to animating and reading sentence
                if (this.firstReading) {
                    // Keep this true even if the target word tries to set it false
                    this.manuallyReading = true
                    // timeout is to pause between reading word and displaying sentence
                    setTimeout( () => {
                        // now animate in sentence
                        this.firstReading = false
                        this.showSentence = true
                        // timeout is to allow sentence animation in to finish 
                        setTimeout( () => {
                            // now begin reading sentence
                            if (this.shouldReadSentence) {
                                this.$refs.sentenceRef.beginNarration()
                            }
                            // we're on hard mode and not reading the sentence, recall this function to finish
                            else {
                                this.finishedTargetWord()
                            }
                        }, 700)
                    }, 350)
                }
                // second time word is read, let the user interact now
                else {
                    this.narrating = false
                    // normal mode needs this set explicitly
                    this.manuallyReading = false
                }
            }
            // else would be for when the user clicks the target word at top of screen, which we dont do anything for
        },

        // We finished reading/highlighting the sentence, now repeat the word to be found
        finishNarration () {
            // timeout is delay between reading sentence and reading target word again
            setTimeout( () => {
                // in easy mode we highlight the word as we read it
                if (this.shouldShowTargetWord) {
                    this.$refs.targetWordRef.readWord()
                }
                // in normal mode we just read it
                else {
                    this.afterSpeak({ word: this.curSentence.targetWord, callback: this.finishedTargetWord })
                }
            }, 350)
        },

        // User clicked a word, if they clicked the right one, move on to the next sentence
        wordPressed (word) {
            if (word === this.curSentence.targetWord) {
                // set this to prevent the user from pressing buttons during transition
                this.narrating = true
                this.manuallyReading = true
                // play a pleasant sound before moving on
                this.playRandomSound((success) => {
                    // animate out our sentence and word
                    this.$refs.sentenceRef.animateOut()
                    if (this.shouldShowTargetWord) {
                        this.$refs.targetWordRef.animateOut()
                    }

                    // timeout to allow animations to finish
                    setTimeout(() => {
                        this.updateData({ word, right: this.correctOnFirstTry })
                        if (this.difficultyReading > difficulty.VERY_EASY) {
                            this.tutorial = false
                        }
                        this.showWord = false
                        this.sentencesRead ++
                        // next word/sentence
                        this.sayGJ(this.getNext)
                    }, 525)
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
        position: absolute;
        top: 0;
        align-self: center;
        margin-top: 50
    }
</style>