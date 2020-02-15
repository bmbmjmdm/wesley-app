<!--currently this is a list of words made of letters -->
<template>
    <view class="word-container">
        <WordMadeOfLetters
            v-for="(word,index) in list"
            class="mb-3"
            :key="word+index+list"
            :ref="'wordRef'"
            :word="word"
            :narrating="narrating"
            :doneReading="readWords"
            :touchableCallback="() => { wordPressed(word, index) }"
            :touchable="!lettersClickable"
            :manually-reading="manuallyReading"
            :set-manually-reading="setManuallyReading"
            :letterPressed="(letter) => { wordPressed(word, index, letter) }"
            :tutorialHighlightWord="tutorial && word === targetWord"
            :tutorialFadeWord="tutorial && word !== targetWord"
            :fadeIn="true"
            :finishNarration="finishLetters"
            :queuedCallback="finishedAnimating" />
    </view>
</template>

<script>
import WordMadeOfLetters from './WordMadeOfLetters'
import { mapGetters } from 'vuex'

export default {
    components: {
        WordMadeOfLetters
    },
    
    props: {
        list: {
            type: Array,
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
        finishLetters: {
            type: Function,
            default: () => {}
        },
        lettersClickable: {
            type: Boolean,
            default: false
        },
        queuedCallback: {
            type: Function,
            default: () => {},
        }
    },

    data () {
        return {
            readThisMany: 0,
            finishedAnimatingCount: 0,
        }
    },

    computed: {        
        ...mapGetters([
        ])
    },

    methods: {
        beginNarration () {
            this.readThisMany = this.list.length
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
                this.finishNarration()
            }
        },

        animateOut () {
            this.finishedAnimatingCount = 0
            this.readThisMany = this.list.length
            while (this.readThisMany > 0) {
                this.$refs.wordRef[this.$refs.wordRef.length-this.readThisMany].animateOut()
                this.readThisMany--
            }
        },

        finishedAnimating () {
            this.finishedAnimatingCount++
            if (this.finishedAnimatingCount >= this.list.length) {
                this.finishedAnimatingCount = 0
                if (this.queuedCallback) {
                    this.queuedCallback()
                }
            }
        },

        readLettersOfWord(index, forceHighlight) {
            this.finishedAnimatingCount = 0
            this.$refs.wordRef[this.$refs.wordRef.length-(this.list.length-index)].readLetters(forceHighlight)
        },
    }


}
</script>


<style>
    .word-container {
        flex-direction: column;
        flex-wrap: wrap;
        align-items: center;
    }
    .mb-3 {
        margin-bottom: 15
    }
</style>