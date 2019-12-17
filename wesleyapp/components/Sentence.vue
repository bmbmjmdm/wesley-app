<template>
    <view class="word-container">
        <Word
            v-for="(word,index) in words"
            :key="word+index+sentence"
            :ref="'wordRef'"
            :word="word"
            :narrating="narrating"
            :fadeAnimations="fadeAnimations"
            :continueSentence="readWords"
            :word-pressed="wordPressed"
            :manually-reading="manuallyReading"
            :set-manually-reading="setManuallyReading"
            :tutorialHighlight="tutorial && word.toLowerCase() === targetWord"
            :tutorialFade="tutorial && word.toLowerCase() !== targetWord" />
    </view>
</template>

<script>
import Word from './Word'
import { mapGetters } from 'vuex'

export default {
    components: {
        Word
    },
    
    props: {
        sentence: {
            type: String,
            required: true
        },
        finishNarration: {
            type: Function,
            required: true
        },
        wordPressed: {
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
        targetWord: {
            type: String,
            default: ""
        },
        tutorial: {
            type: Boolean,
            default: false
        },
        fadeAnimations: {
          type: Boolean,
          default: false
        }
    },

    data () {
        return {
            readThisMany: 0,
        }
    },

    computed: {
        // split up the sentence into words
        words () {
            // use spaces to determine splits
           return this.sentence.split(" ")
        },
        
        ...mapGetters([
        ])
    },

    methods: {
        beginNarration () {
            this.readThisMany = this.words.length
            this.readWords()
        },

        // Hey dale, this is wierd TODO=========================================
        // the v-for apparently retains all old references, so we are currently
        // counting cumulatively, but this is bad because it'll make the logic way more
        // complicated and may cause poor performance
        readWords () {
            // recursive call to highlight each word in turn
            if (this.readThisMany > 0) {
                this.$refs.wordRef[this.$refs.wordRef.length-this.readThisMany].readWord()
                this.readThisMany--
            }
            // cleanup
            else {
                this.readThisMany = this.words.length
                while (this.readThisMany > 0) {
                    this.$refs.wordRef[this.$refs.wordRef.length-this.readThisMany].clearHighlight()
                    this.readThisMany--
                }
                this.finishNarration()
            }
        },

        animateOut () {
            this.readThisMany = this.words.length
            while (this.readThisMany > 0) {
                this.$refs.wordRef[this.$refs.wordRef.length-this.readThisMany].animateOut()
                this.readThisMany--
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