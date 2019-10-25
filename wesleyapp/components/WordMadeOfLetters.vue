<template>
    <view class="word-container">
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
            :tutorial-highlight="tutorial && letter === targetLetter"
            :tutorial-fade="tutorial && letter !== targetLetter"
            :position="index === 0 ? 'left' : index === word.length-1 ? 'right' : 'center'"
            :transparent="transparent"
            :start-split="startSplit"
            :fade-in="fadeIn" />
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
            required: true
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
        doneSplitting: {
            type: Function,
            required: true
        },
        doneJoining: {
            type: Function,
            required: true
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
        }
    },

    data () {
        return {
            readThisMany: 0,
            doneHighlighting: false,
            doneSpeaking: false
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

        readLetters () {
            this.readThisMany = this.letters.length
            this.continueReadLetters()
        },

        // Hey dale, this is wierd TODO=========================================
        // the v-for apparently retains all old references, so we are currently
        // counting cumulatively, but this is bad because it'll make the logic way more
        // complicated and may cause poor performance
        continueReadLetters () {
            // recursive call to highlight each letter in turn
            if (this.readThisMany > 0) {
                this.$refs.letterRef[this.$refs.letterRef.length-this.readThisMany].readLetter()
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
            this.readThisMany = this.letters.length
            while (this.readThisMany > 0) {
                this.$refs.letterRef[this.$refs.letterRef.length-this.readThisMany].becomeSeperated()
                this.readThisMany--
            }
            setTimeout(() => { this.doneSplitting() }, 1000)
        },

        joinLetters () {
            this.readThisMany = this.letters.length
            while (this.readThisMany > 0) {
                this.$refs.letterRef[this.$refs.letterRef.length-this.readThisMany].reverseSeperation()
                this.readThisMany--
            }
            setTimeout(() => { this.doneJoining() }, 1000)
        },

        readLetter (position, callback) {
            this.$refs.letterRef[this.$refs.letterRef.length-this.letters.length+position].readLetter(callback)
        },

        hideLetter (position) {
            this.$refs.letterRef[this.$refs.letterRef.length-this.letters.length+position].animateOpacity(0)
        },

        showLetter (position) {
            this.$refs.letterRef[this.$refs.letterRef.length-this.letters.length+position].animateOpacity(1)
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
            setTimeout(this.continueReadWord, this.highlightSpeed)
        },

        continueReadWord () {
            // recursive call to highlight each letter in turn
            if (this.readThisMany > 0) {
                this.$refs.letterRef[this.$refs.letterRef.length-this.readThisMany].highlightLetter()
                this.readThisMany--
                setTimeout(this.continueReadWord, this.highlightSpeed)
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
                this.doneReading()
            }
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