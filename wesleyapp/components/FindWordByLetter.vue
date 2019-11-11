<template>
    <view class="container">
        <view class="letter-to-find">
            <Letter
                v-if="shouldShowLetter && showLetter"
                ref="letterRef"
                :key="curList.letter + curList.list"
                :letter="curList.letter"
                :letterPressed="finishedLetterHint"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :narrating="false"
                :continueSequence="()=>{}" />
        </view>
        <view class="word-list">
            <WordList
                v-if="showList"
                ref="listRef"
                :finish-narration="finishNarration"
                :list="curList.list"
                :word-pressed="wordPressed"
                :narrating="narrating"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :tutorial="tutorial"
                :targetWord="curList.targetWord" />
        </view>
    </view>
</template>

<script>
import WordList from './WordList'
import Letter from './Letter'
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
        WordList,
        Letter,
    },

    data () {
        return {
            narrating: false,
            curList: {list: [], targetWord: "", letter: "", pic: null},
            manuallyReading: false,
            firstReading: true,
            tutorial: true,
            showList: false,
            showLetter: false,
            firstList: true,
            listsRead: 0,
            correctOnFirstTry: true
        }
    },

    mounted () {
        this.getNext()
    },

    computed: {
        // we only show the letter hint on easy mode. we speak it on all modes
        shouldShowLetter () {
            return this.difficultySpelling === "easy"
        },

        // we read the list on easy and normal mode, but not hard
        shouldReadList () {
            return this.difficultySpelling !== "hard"
        },
        
        ...mapGetters([
            'difficultySpelling',
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

        // Move on to the next list/target word. This does the following in order:
        // Animates out the current list (and letter hint if on easy mode)
        // Loads the new image and sets it as the background
        // Reads the new letter hint (and displays it if in easy mode)
        // Displays the new list (and reads it if in easy/normal mode)
        getNext () {
            // after 4 lists are read, go on to next activity
            if (this.listsRead >= 4) {
                this.randomActivity()
            }
            // still in this activity, go on to next list
            else {
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
                // show image and change background
                this.fadeNewBackground()
            }
        },

        fadeNewBackground () {
            // currently not using the pic / changing the background
            //this.changeBackground(this.curList.pic, () => {
                // new image is now displayed as background, animate in letter hint
                this.showLetter = true
                var letterAnimateTime = 700
                if (!this.shouldShowLetter) {
                    letterAnimateTime = 0
                }
                // timeout is to allow letter animation to finish
                // if were in easy mode theres no animation so timeout time is 0
                setTimeout(() => {
                    // speak and highlight the letter
                    if (this.shouldShowLetter) {
                        this.$refs.letterRef.readLetter()
                    }
                    // just speak it
                    else {
                        this.afterSpeak({ word: this.curList.letter, callback: this.finishedLetterHint })
                    }
                }, letterAnimateTime)
            //})
        },

        finishedLetterHint () {
            // callback to move on to reading the list after letter hint is read
            if (this.narrating) {
                // The first time the letter is read, move on to animating and reading list
                if (this.firstReading) {
                    // Keep this true even if the letter hint tries to set it false
                    this.manuallyReading = true
                    // timeout is to pause between reading letter and displaying list
                    setTimeout( () => {
                        // now animate in list
                        this.firstReading = false
                        this.showList = true
                        // timeout is to allow list animation in to finish 
                        setTimeout( () => {
                            // now begin reading list
                            if (this.shouldReadList) {
                                this.$refs.listRef.beginNarration()
                            }
                            // we're on hard mode and not reading the list, recall this function to finish
                            else {
                                this.finishedLetterHint()
                            }
                        }, 700)
                    }, 350)
                }
                // second time letter is read, let the user interact now
                else {
                    this.narrating = false
                    // normal mode needs this set explicitly
                    this.manuallyReading = false
                }
            }
            // else would be for when the user clicks the letter hint at top of screen, which we dont do anything for
        },

        // We finished reading/highlighting the list, now repeat the letter hint
        finishNarration () {
            // timeout is delay between reading list and reading letter hint again
            setTimeout( () => {
                // in easy mode we highlight the letter as we read it
                if (this.shouldShowLetter) {
                    this.$refs.letterRef.readLetter()
                }
                // in normal mode we just read it
                else {
                    this.afterSpeak({ word: this.curList.letter, callback: this.finishedLetterHint })
                }
            }, 350)
        },

        // User clicked a word, if they clicked the right one, move on to the next list
        wordPressed (word) {
            if (word === this.curList.targetWord) {
                // set this to prevent the user from pressing buttons during transition
                this.narrating = true
                this.manuallyReading = true
                // play a pleasant sound before moving on
                this.playRandomSound((success) => {
                    // animate out our list and letter
                    this.$refs.listRef.animateOut()
                    if (this.shouldShowLetter) {
                        this.$refs.letterRef.animateOut()
                    }
                    // timeout to allow animations to finish
                    setTimeout(() => {
                        this.updateData({ word, right: this.correctOnFirstTry })
                        this.tutorial = false
                        this.listsRead ++
                        // next word/list
                        this.sayGJ(this.getNext)
                    }, 1000)
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
        flex-direction: column;
    }

    .letter-to-find {
        position: absolute;
        top: 0;
        align-self: center;
        margin-top: 40
    }

    .word-list {
        position: absolute;
        top: 100;
        align-self: center;
        margin-top: 50
    }
</style>