<template>
    <view class="container">
        <view class="letter-to-find">
            <Letter
                v-if="shouldShowLetter && showLetter"
                ref="letterRef"
                :key="curList.targetWord + curList.allWords"
                :letter="curList.targetWord"
                :letterPressed="() => {}"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :narrating="false"
                :continueSequence="()=>{}"
                :fadeIn="true"
                :finishedAnimating="queuedCallback" />
        </view>
        <view :class="{'mt-10': sizeFactor < 1}">
            <WordList
                v-if="showList"
                ref="listRef"
                :finish-narration="finishNarration"
                :finishLetters="doneSpelling"
                :list="curList.allWords"
                :word-pressed="wordPressed"
                :narrating="narrating"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :tutorial="tutorial"
                :targetWord="curWord"
                :lettersClickable="shouldClickLetters"
                :queuedCallback="queuedCallback"
                :joinEntrance="true" />
        </view>
    </view>
</template>

<script>
import WordList from './WordList'
import Letter from './Letter'
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
        WordList,
        Letter,
    },

    data () {
        return {
            narrating: false,
            curList: {allWords: [], targetWord: ""},
            manuallyReading: false,
            firstReading: true,
            tutorial: false,
            showList: false,
            showLetter: false,
            firstList: true,
            listsRead: 0,
            correctOnFirstTry: true,
            queuedCallback: null,
            callbackCount: 0,
        }
    },

    mounted () {
        if (this.difficultySpelling < difficulty.HARD) {
            this.tutorial = true
        }
        this.getNext()
    },

    computed: {
        // we only show the letter hint on easy mode. we speak it on all modes
        shouldShowLetter () {
            return this.difficultySpelling <= difficulty.EASY
        },

        // we read the list on easy and normal mode, but not hard
        shouldReadList () {
            return this.difficultySpelling < difficulty.HARD
        },

        shouldClickLetters () {
            return this.difficultySpelling >= difficulty.HARD
        },

        curWord () {
            for (let word of this.curList.allWords) {
                if (word.toLowerCase().includes(this.curList.targetWord)) {
                    return word
                }
            }
        },
        
        ...mapGetters([
            'difficultySpelling',
            'getNextWord',
            'sizeFactor'
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

        // Move on to the next list/target word. This does the following in order:
        // Animates out the current list (and letter hint if on easy mode)
        // Loads the new image and sets it as the background
        // Reads the new letter hint (and displays it if in easy mode)
        // Displays the new list (and reads it if in easy/normal mode)
        async getNext () {
            this.queuedCallback = null
            await this.finishLevelUp()
            // after 4 lists are read, go on to next activity
            if (this.listsRead >= 4) {
                this.randomActivity()
            }
            // still in this activity, go on to next list
            else {
                // incase the background changed during a level up, reset it
                this.defaultBackground()
                this.correctOnFirstTry = true
                // disable interaction
                this.manuallyReading = true
                this.narrating = true
                this.firstReading = true
                // hide these while we switch curList
                this.showList = false
                this.showLetter = false
                // move on to next list/word
                this.curList = this.getNextWord()
                // show letter
                this.animateLetter()
            }
        },

        animateLetter () {
            // prepare the callback for after animation finishes
            this.queuedCallback = () => {
                // speak and highlight the letter
                if (this.shouldShowLetter) {
                    this.$refs.letterRef.readLetter(this.finishedLetterHint)
                }
                // just speak it
                else {
                    this.afterSpeak({ word: this.curList.targetWord, callback: this.finishedLetterHint })
                }
            }

            // animate in the letter
            this.showLetter = true
            // if were in easy mode theres no animation
            if (!this.shouldShowLetter) {
                this.queuedCallback()
            }
        },

        finishedLetterHint () {
            // The first time the letter is read, move on to animating and reading list
            if (this.firstReading) {
                // Keep this true even if the letter hint tries to set it false
                this.manuallyReading = true
                // timeout is to pause between reading letter and displaying list
                setTimeout( () => {
                    // prepare the callback for after animation finishes
                    this.queuedCallback = () => {
                        // now begin reading list
                        if (this.shouldReadList) {
                            this.$refs.listRef.beginNarration()
                        }
                        // we're on hard mode and not reading the list, recall this function to finish
                        else {
                            this.finishedLetterHint()
                        }
                    }
                    // now animate in list
                    this.firstReading = false
                    this.showList = true
                }, 350)
            }
            // second time letter is read, let the user interact now
            else {
                // set timeout to allow shrinking animation to finish
                setTimeout(() => {
                    this.narrating = false
                    // normal mode needs this set explicitly
                    this.manuallyReading = false
                }, 300)
            }
        },

        // We finished reading/highlighting the list, now repeat the letter hint
        finishNarration () {
            // timeout is delay between reading list and reading letter hint again
            setTimeout( () => {
                // in easy mode we highlight the letter as we read it
                if (this.shouldShowLetter) {
                    this.$refs.letterRef.readLetter(this.finishedLetterHint)
                }
                // in normal mode we just read it
                else {
                    this.afterSpeak({ word: this.curList.targetWord, callback: this.finishedLetterHint })
                }
            }, 350)
        },

        // User clicked a word, if they clicked the right one, move on to the next list
        // if we're on hard mode, they must have clicked the right letter
        wordPressed (word, index, letter) {
            if ((word.toLowerCase().includes(this.curList.targetWord)) && (!this.shouldClickLetters || letter.toLowerCase() === this.curList.targetWord)) {
                // set this to prevent the user from pressing buttons during transition
                this.narrating = true
                this.manuallyReading = true
                this.queuedCallback = this.doneSpelling
                Vue.nextTick(() => this.$refs.listRef.readLettersOfWord(index, true))
            }
            else {
                this.correctOnFirstTry = false
            }
        },

        // correct word finished spelling after being pressed
        async doneSpelling () {
            // prepare the callback for after animation finishes
            this.callbackCount = 0
            this.queuedCallback = async () => {
                this.callbackCount++
                if (this.callbackCount >= 2) {
                    let levelUp = await this.updateData({ word: this.curList.targetWord, right: this.correctOnFirstTry })
                    this.showLetter = false
                    if (this.difficultySpelling > difficulty.VERY_EASY) {
                        this.tutorial = false
                    }
                    this.listsRead ++
                    // next word/list
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
                // animate out our list and letter
                this.$refs.listRef.animateOut()
                if (this.shouldShowLetter) {
                    this.$refs.letterRef.animateOut()
                }
                else {
                    // we're not animating letter so count it as finished
                    this.callbackCount++
                }
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

    .letter-to-find {
        position: absolute;
        top: 0;
        align-self: center;
        margin-top: 50
    }

    .mt-10 {
        margin-top: 75
    }
</style>