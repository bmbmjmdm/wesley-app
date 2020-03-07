<template>
    <touchable-opacity
        v-if="touchable"
        :onPress="manualReadWord"
        class="word-container">
        <Letter
            v-for="(letter,index) in letters"
            :key="letter+index+word"
            :ref="'letterRef'"
            :letter="letter"
            :narrating="narrating"
            :continueSequence="continueReadLetters"
            :letter-pressed="(ltr) => { letterPressed(ltr, index) }"
            :manually-reading="manuallyReading"
            :set-manually-reading="setManuallyReading"
            :tutorial-highlight="(tutorial && letter === targetLetter) || tutorialHighlightWord"
            :tutorial-fade="(tutorial && letter !== targetLetter) || tutorialFadeWord"
            :position="index === 0 ? 'left' : index === word.length-1 ? 'right' : 'center'"
            :transparent="transparent"
            :start-split="startSplit"
            :fade-in="fadeIn"
            :disabled="true"
            :finishedAnimating="finishedAnimating"
            :noExpand="true" />
    </touchable-opacity>
    <view
        v-else
        class="word-container">
        <Letter
            v-for="(letter,index) in letters"
            :key="letter+index+word"
            :ref="'letterRef'"
            :letter="letter"
            :narrating="narrating"
            :continueSequence="continueReadLetters"
            :letter-pressed="(ltr) => { letterPressed(ltr, index) }"
            :manually-reading="manuallyReading"
            :set-manually-reading="setManuallyReading"
            :tutorial-highlight="(tutorial && letter === targetLetter) || tutorialHighlightWord"
            :tutorial-fade="(tutorial && letter !== targetLetter) || tutorialFadeWord"
            :position="index === 0 ? 'left' : index === word.length-1 ? 'right' : 'center'"
            :transparent="transparent"
            :start-split="startSplit"
            :fade-in="fadeIn"
            :finishedAnimating="finishedAnimating" />
    </view>
</template>

<script>
import Letter from './Letter'
import { mapGetters, mapActions } from 'vuex'

export default {
    components: {
        Letter
    },
    
    props: {
        word: {
            type: String,
            required: true
        },
        targetLetter: {
            type: String,
            default: ''
        },
        finishNarration: {
            type: Function,
            default: () => {}
        },
        letterPressed: {
            type: Function,
            required: true
        },
        narrating: {
            type: Boolean,
            required: true
        },
        setManuallyReading: {
            type: Function,
            required: true
        },
        manuallyReading: {
            type: Boolean,
            required: true
        },
        tutorial: {
            type: Boolean,
            default: false
        },
        startSplit: {
            type: Boolean,
            default: false
        },
        transparent: {
            type: Boolean,
            default: false
        },
        fadeIn: {
            type: Boolean,
            default: false
        },
        doneReading: {
            type: Function,
            required: true
        },
        touchable: {
            type: Boolean,
            default: false,
        },
        touchableCallback: {
            type: Function,
            default: null
        },
        tutorialHighlightWord: {
            type: Boolean,
            default: false,
        },
        tutorialFadeWord: {
            type: Boolean,
            default: false,
        },
        queuedCallback: {
            type: Function,
            default: () => {},
        }
    },

    data () {
        return {
            readThisMany: 0,
            doneHighlighting: false,
            doneSpeaking: false,
            pressed: false,
            finishedAnimatingCount: 0,
            animateOne: false,
        }
    },

    computed: {
        // split up the word into letters
        letters () {
           return this.word.split("")
        },
        
        ...mapGetters([
            'highlightSpeed',
        ])
    },

    methods: {
        ...mapActions([
            'afterSpeak'
        ]),

        readLetters (forceHighlight) {
            this.readThisMany = this.letters.length
            this.continueReadLetters(forceHighlight)
        },

        // forceHighlight is for findWordByLetter, so the first letter that is about to be unhighlighted gets relit
        // Hey dale, this is wierd TODO=========================================
        // the v-for apparently retains all old references, so we are currently
        // counting cumulatively, but this is bad because it'll make the logic way more
        // complicated and may cause poor performance
        continueReadLetters (forceHighlight = false) {
            // recursive call to highlight each letter in turn
            if (this.readThisMany > 0) {
                this.$refs.letterRef[this.$refs.letterRef.length-this.readThisMany].readLetter(null, null, forceHighlight)
                this.readThisMany--
            }
            // cleanup
            else {
                this.readThisMany = this.letters.length
                while (this.readThisMany > 0) {
                    this.$refs.letterRef[this.$refs.letterRef.length-this.readThisMany].unhighlightLetter()
                    this.readThisMany--
                }
                this.finishNarration()
            }
        },

        animateOut () {
            this.readThisMany = this.letters.length
            while (this.readThisMany > 0) {
                this.$refs.letterRef[this.$refs.letterRef.length-this.readThisMany].animateOut()
                this.readThisMany--
            }
        },

        splitLetters () {
            this.finishedAnimatingCount = 0
            this.readThisMany = this.letters.length
            while (this.readThisMany > 0) {
                this.$refs.letterRef[this.$refs.letterRef.length-this.readThisMany].becomeSeperated()
                this.readThisMany--
            }
        },

        joinLetters () {
            this.finishedAnimatingCount = 0
            this.readThisMany = this.letters.length
            while (this.readThisMany > 0) {
                this.$refs.letterRef[this.$refs.letterRef.length-this.readThisMany].reverseSeperation()
                this.readThisMany--
            }
        },

        finishedAnimating () {
            // if we're only showing/hiding one letter, we dont need a callback
            if (this.animateOne) {
              this.animateOne = false
              return
            }
            // otherwise, wait until all letters are done before callback
            this.finishedAnimatingCount++
            if (this.finishedAnimatingCount >= this.letters.length) {
                this.animateOne = false
                this.finishedAnimatingCount = 0
                if (this.queuedCallback) {
                    this.queuedCallback()
                }
            }
        },

        readLetter (position, callback) {
            this.$refs.letterRef[this.$refs.letterRef.length-this.letters.length+position].readLetter(callback)
        },

        hideLetter (position) {
            this.animateOne = true
            this.$refs.letterRef[this.$refs.letterRef.length-this.letters.length+position].animateOpacity(0)
        },

        showLetter (position) {
            this.animateOne = true
            this.$refs.letterRef[this.$refs.letterRef.length-this.letters.length+position].animateOpacity(1)
        },

        manualReadWord () {
            if (!this.manuallyReading && !this.narrating) {
                this.setManuallyReading(true)
                this.pressed = true
                this.readWord()
            }
        },

        readWord () {
            this.readThisMany = this.letters.length
            this.doneHighlighting = false
            this.doneSpeaking = false
            this.afterSpeak({
                word: this.word,
                callback: () => {
                    this.doneSpeaking = true
                    this.finishReading()
                }
            })
            setTimeout(this.continueReadWord, this.highlightSpeed(this.word))
        },

        continueReadWord () {
            // recursive call to highlight each letter in turn
            if (this.readThisMany > 0) {
                this.$refs.letterRef[this.$refs.letterRef.length-this.readThisMany].highlightLetter()
                this.readThisMany--
                setTimeout(this.continueReadWord, this.highlightSpeed(this.word))
            }
            else {
                this.doneHighlighting = true
                this.finishReading()
            }
        },

        finishReading () {
            if (this.doneHighlighting && this.doneSpeaking) {
                let clearThisMany = this.letters.length
                while (clearThisMany > 0) {
                    this.$refs.letterRef[this.$refs.letterRef.length-clearThisMany].unhighlightLetter()
                    clearThisMany--
                }
                // doneReading is specifically for narrating, whereas touchableCallback is for manual pressing
                if (this.pressed) {
                    this.setManuallyReading(false)
                    this.pressed = false
                    this.touchableCallback()
                }
                else {
                    this.doneReading()
                }
            }
        },

        pressLetter(index) {
            // negative distance from end of word
            let position = index - this.word.length
            this.$refs.letterRef[this.$refs.letterRef.length + position].readLetter(this.finishNarration, true)
        },
    }


}
</script>


<style>
    .word-container {
        flex-direction: row;
        flex-wrap: wrap;
    }
</style>