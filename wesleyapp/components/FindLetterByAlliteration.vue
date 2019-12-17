<template>
    <view class="container">
        <view
            v-if="shouldShowSentence"
            class="half-container">
            <Sentence
                v-if="showSentence"
                ref="sentenceRef"
                :finish-narration="sentenceDone"
                :sentence="curSentence.alliteration"
                :word-pressed="() => {}"
                :narrating="narrating"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :tutorial="tutorial"
                :fadeAnimations="true"
                targetWord="" />
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
                :fadeIn="true" />
        </view>
    </view>
</template>

<script>
import Sentence from './Sentence'
import WordMadeOfLetters from './WordMadeOfLetters'
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
        WordMadeOfLetters,
    },

    data () {
        return {
            narrating: false,
            curSentence: {alliteration: "", targetWord: ""},
            manuallyReading: false,
            tutorial: true,
            showLetters: false,
            showSentence: false,
            firstSentence: true,
            sentencesRead: 0,
            correctOnFirstTry: true,
            firstReading: false,
        }
    },

    mounted () {
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
            let tlAdded = false
            while (letters.length < 5) {
                // random chance target letter is added if not there yet
                // if we're on the last letter, we have to add it
                if ((Math.random() < 0.5 || letters.length == 4) && !tlAdded) {
                    tlAdded = true
                    letters = letters + targetLetter
                    continue
                }
                // normal random letter
                let potLet = alphabet.charAt(Math.floor(Math.random() * alphabet.length))
                if (potLet != targetLetter) {
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
            'updateData'
        ]),
        ...mapActions([
            'afterSpeak'
        ]),

        // Move on to the next sentence/letter. This does the following in order:
        // Animates out the current letter options (and example sentence if on easy/medium mode)
        // Displays the new sentence if on easy/medium (and reads it if on easy/hard)
        // Displays the letter options
        getNext () {
            // after 4 sentences are read, go on to next activity
            if (this.sentencesRead >= 4) {
                this.randomActivity()
            }
            // still in this activity, go on to next sentence/letter
            else {
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
                this.introduceSentence()
            }
        },

        introduceSentence () {
          // animate in sentence if not on hard
          this.showSentence = true
          var sentenceAnimateTime = 1000
          if (!this.shouldShowSentence) {
              sentenceAnimateTime = 0
          }
          // timeout is to allow sentence animation to finish
          // if were in hard mode theres no animation so timeout time is 0
          setTimeout(() => {
              // speak and highlight the sentence
              if (this.shouldShowSentence && this.shouldReadSentence) {
                  this.$refs.sentenceRef.beginNarration()
              }
              // just speak it
              else if (this.shouldReadSentence) {
                  this.afterSpeak({ word: this.curSentence.alliteration, callback: this.sentenceDone })
              }
              else {
                  this.sentenceDone()
              }
          }, sentenceAnimateTime)
        },

        sentenceDone () {
          // Sentence was just read as part of introduction
          // display letter options now that sentence is done animating/reading
          if (this.firstReading) {
              // Keep this true even if the sentence tries to set it false (dunno if necessary)
              this.manuallyReading = true
              // animate in letters
              this.showLetters = true
              // timeout is to allow letter animation in to finish 
              setTimeout(this.finishLetters, 1000)
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
                // set this to prevent the user from pressing buttons during transition
                this.narrating = true
                this.manuallyReading = true
                // speak and highlight the sentence
                if (this.shouldShowSentence) {
                    this.$refs.sentenceRef.beginNarration()
                }
                // just speak it
                else {
                    this.afterSpeak({ word: this.curSentence.alliteration, callback: this.sentenceDone })
                }
            }
            else {
                this.correctOnFirstTry = false
            }
        },

        finishOutro() {
          // play a pleasant sound before moving on
          this.playRandomSound((success) => {
              // animate out our sentence and letters
              this.$refs.letterOptionsRef.animateOut()
              if (this.shouldShowSentence) {
                  this.$refs.sentenceRef.animateOut()
              }

              // timeout to allow animations to finish
              setTimeout(() => {
                  this.updateData({ word: this.curSentence.targetWord, right: this.correctOnFirstTry })
                  if (this.difficultySpelling > difficulty.VERY_EASY) {
                    this.tutorial = false
                  }
                  this.showSentence = false
                  this.showLetters = false
                  this.sentencesRead ++
                  // next word/sentence
                  this.sayGJ(this.getNext)
              }, 1000)
          })
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

    .half-container {
        align-items: center;
        justify-content: center;
        flex: 1;
        flex-direction: row;
    }
</style>