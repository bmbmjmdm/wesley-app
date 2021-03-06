<template>
    <view class="container">
        <view class="half-container">
            <Sentence
                v-if="shouldShowSentence && showSentence"
                ref="sentenceRef"
                :finish-narration="sentenceDone"
                :sentence="curSentence.alliteration"
                :word-pressed="() => {}"
                :narrating="narrating"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :tutorial="false"
                :fadeAnimations="true"
                targetWord=""
                :queuedCallback="queuedCallback" />
            <RepeatWord
                v-else-if="showSentence"
                :word="curSentence.alliteration"
                ref="sentenceRef"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :finishedAnimating="queuedCallback"
                :fadeAnimations="true" />
        </view>
        <view class="half-container">
            <WordMadeOfLetters 
                v-if="showLetters"
                ref="letterOptionsRef"
                :key="curSentence.targetWord + 'options'"
                :finish-narration="finishOutro"
                :word="mixedLetters"
                :narrating="narrating"
                :setManuallyReading="setManuallyReading"
                :letterPressed="letterPressed"
                :manuallyReading="manuallyReading"
                :tutorial="tutorial"
                :targetLetter="curSentence.targetWord.charAt(0)"
                :doneSplitting="() => {}"
                :doneJoining="() => {}"
                :doneReading="() => {}"
                :startSplit="true"
                :fadeIn="true"
                :queuedCallback="queuedCallback" />
        </view>
    </view>
</template>

<script>
import Sentence from './Sentence'
import RepeatWord from './RepeatWord'
import WordMadeOfLetters from './WordMadeOfLetters'
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
        Sentence,
        WordMadeOfLetters,
        RepeatWord
    },

    data () {
        return {
            narrating: false,
            curSentence: {alliteration: "", targetWord: ""},
            manuallyReading: false,
            tutorial: false,
            showLetters: false,
            showSentence: false,
            firstSentence: true,
            sentencesRead: 0,
            correctOnFirstTry: true,
            firstReading: false,
            queuedCallback: null,
            callbackCount: 0,
            allWords: [],
        }
    },

    mounted () {
        if (this.difficultySpelling < difficulty.HARD) {
            this.tutorial = true
        }
        this.getNext()
    },

    computed: {
        // we show the sentence on easy and medium difficulty
        shouldShowSentence () {
            return this.difficultySpelling < difficulty.HARD
        },

        // we read the sentence on easy and hard mode
        shouldReadSentence () {
            return this.difficultySpelling !== difficulty.MEDIUM
        },

        // make mix of 5 letters including the target letter
        mixedLetters () {
          let targetLetter = this.curSentence.targetWord.charAt(0)
            let letters = ""
            // lol shutup i dont have internet atm
            let alphabet = "abcdefghijklmnopqrstuvwxyz"
            while (letters.length < 5) {
                // random chance target letter is added if not there yet
                // if we're on the last letter, we have to add it
                if ((Math.random() < 0.5 || letters.length == 4) && !letters.includes(targetLetter)) {
                    letters = letters + targetLetter
                    continue
                }
                // normal random letter
                let potLet = alphabet.charAt(Math.floor(Math.random() * alphabet.length))
                if (potLet != targetLetter && !letters.includes(potLet)) {
                    letters = letters + potLet
                }
            }
            return letters
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
            'updateData',
            'finishLevelUp'
        ]),

        // Move on to the next sentence/letter. This does the following in order:
        // Animates out the current letter options (and example sentence if on easy/medium mode)
        // Displays the new sentence if on easy/medium (and reads it if on easy/hard)
        // Displays the letter options
        async getNext () {
            this.queuedCallback = null
            await this.finishLevelUp()
            // after 4 sentences are read, go on to next activity
            if (this.sentencesRead >= 4) {
                this.randomActivity()
            }
            // still in this activity, go on to next sentence/letter
            else {
                // incase the background changed during a level up, reset it
                this.defaultBackground()
                this.correctOnFirstTry = true
                // disable interaction
                this.manuallyReading = true
                this.narrating = true
                // hide these while we switch curSentence
                this.showSentence = false
                this.showLetters = false
                // move on to next sentence/word
                this.firstReading = true
                this.curSentence = this.getNextWord()
                // animate in (or read) sentence
                this.queuedCallback = () => {}
                this.introduceSentence()
            }
        },

        introduceSentence () {
          // prepare the callback for after animation finishes
          callback = () => {
              // speak and highlight the sentence
              if (this.shouldShowSentence && this.shouldReadSentence) {
                  this.$refs.sentenceRef.beginNarration()
              }
              // just speak it
              else if (this.shouldReadSentence) {
                  this.readAliteration()
              }
              else {
                  this.sentenceDone()
              }
          }

          // if were not in easy mode we dont wait for the speaker to finish showing
          if (!this.shouldShowSentence) {
              this.showSentence = true
              callback()
          }
          else {
              this.queuedCallback = callback
              this.showSentence = true
          }
        },

        sentenceDone () {
          // Sentence was just read as part of introduction
          // display letter options now that sentence is done animating/reading
          if (this.firstReading) {
              // set timeout to allow shrinking animation to finish
              setTimeout(() => {
                // Keep this true even if the sentence tries to set it false (dunno if necessary)
                this.manuallyReading = true
                // prepare the callback for after animation finishes
                this.queuedCallback = this.finishLetters
                // animate in letters
                this.showLetters = true
              }, 300)
          }
          else {
              // Sentence was just read as part of exit repetition
              // read the target letter again
              let index = this.mixedLetters.indexOf(this.curSentence.targetWord.charAt(0))
              this.$refs.letterOptionsRef.pressLetter(index)
          }
        },

        // Letters are now shown, give control back to user
        finishLetters () {
            this.firstReading = false
            this.narrating = false
            this.manuallyReading = false
        },

        // User clicked a letter option, see if its the one we're looking for
        letterPressed (letter) {
            if (letter === this.curSentence.targetWord.charAt(0)) {
                // set timeout to allow shrinking animation to finish
                setTimeout(() => {
                    // set this to prevent the user from pressing buttons during transition
                    this.narrating = true
                    this.manuallyReading = true
                    // speak and highlight the sentence
                    if (this.shouldShowSentence) {
                        this.$refs.sentenceRef.beginNarration()
                    }
                    // just speak it
                    else {
                        this.readAliteration()
                    }
                }, 300)
            }
            else {
                this.correctOnFirstTry = false
            }
        },

        async finishOutro() {
            // prepare the callback for after animation finishes
            this.callbackCount = 0
            this.queuedCallback = async () => {
                this.callbackCount++
                if (this.callbackCount >= 2) {
                    let levelUp = await this.updateData({ word: this.curSentence.targetWord, right: this.correctOnFirstTry })
                    if (this.difficultySpelling > difficulty.VERY_EASY) {
                        this.tutorial = false
                    }
                    this.showSentence = false
                    this.showLetters = false
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
                // animate out our sentence and letters
                this.$refs.letterOptionsRef.animateOut()
                this.$refs.sentenceRef.animateOut()
            })
        },

        // alliteration sentence needs each word to be spoken seperately to get user voice
        readAliteration () {
            this.allWords = this.curSentence.alliteration.split(' ')
            this.speakLoop()
        },

        speakLoop () {
            if (this.allWords.length > 0) {
                let readWord = this.allWords.shift()
                this.afterSpeak({
                    word: readWord,
                    callback: this.speakLoop
                })
            }
            else {
                this.sentenceDone()
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
        flex-direction: column;
    }

    .half-container {
        align-items: center;
        justify-content: center;
        flex: 1;
        flex-direction: row;
    }
</style>