<template>
    <view class="word-container-outer">
        <view class="word-container-inner">
            <Word
                :style="wordMargin"
                :key="words[0].word + 0 + words"
                :ref="'wordRef0'"
                :word="words[0].word"
                :pic="words[0].pic"
                :narrating="narrating"
                :continueSentence="readWords"
                :word-pressed="wordPressed"
                :manually-reading="manuallyReading"
                :set-manually-reading="setManuallyReading"
                :tutorialHighlight="tutorial && words[0].word === targetWord"
                :tutorialFade="tutorial && words[0].word !== targetWord"
                :unhighlightDuringNarration="true" /> 
            <Word
                :style="wordMargin"
                :key="words[1].word + 1 + words"
                :ref="'wordRef1'"
                :word="words[1].word"
                :pic="words[1].pic"
                :narrating="narrating"
                :continueSentence="readWords"
                :word-pressed="wordPressed"
                :manually-reading="manuallyReading"
                :set-manually-reading="setManuallyReading"
                :tutorialHighlight="tutorial && words[1].word === targetWord"
                :tutorialFade="tutorial && words[1].word !== targetWord"
                :unhighlightDuringNarration="true" />
        </view>
        <view class="word-container-inner">
            <Word
                :style="wordMargin"
                :key="words[2].word + 2 + words"
                :ref="'wordRef2'"
                :word="words[2].word"
                :pic="words[2].pic"
                :narrating="narrating"
                :continueSentence="readWords"
                :word-pressed="wordPressed"
                :manually-reading="manuallyReading"
                :set-manually-reading="setManuallyReading"
                :tutorialHighlight="tutorial && words[2].word === targetWord"
                :tutorialFade="tutorial && words[2].word !== targetWord"
                :unhighlightDuringNarration="true" />
            <Word
                :style="wordMargin"
                :key="words[3].word + 3 + words"
                :ref="'wordRef3'"
                :word="words[3].word"
                :pic="words[3].pic"
                :narrating="narrating"
                :continueSentence="readWords"
                :word-pressed="wordPressed"
                :manually-reading="manuallyReading"
                :set-manually-reading="setManuallyReading"
                :tutorialHighlight="tutorial && words[3].word === targetWord"
                :tutorialFade="tutorial && words[3].word !== targetWord"
                :unhighlightDuringNarration="true" />
        </view>
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
        // words is expected to be exactly 4 in length
        words: {
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
    },

    data () {
        return {
            readThisMany: 0,
        }
    },

    computed: {
        wordMargin () {
            return {
                marginTop: 50 * this.sizeFactor,
                marginBottom: 50 * this.sizeFactor,
                marginRight: 85 * this.sizeFactor,
                marginLeft: 85 * this.sizeFactor
            }
        },

        ...mapGetters([
            'sizeFactor'
        ])
    },

    methods: {
        beginNarration () {
            this.readThisMany = this.words.length
            this.readWords()
        },

        readWords () {
            // recursive call to highlight each word in turn
            if (this.readThisMany > 0) {
                // we use timeout to delay in between words, since this isn't a sentence
                setTimeout(() => {
                    this.$refs['wordRef' + (this.words.length-this.readThisMany)].readWord()
                    this.readThisMany--
                }, 333)
            }
            // cleanup
            else {
                this.finishNarration()
            }
        },

        animateOut () {
            this.readThisMany = this.words.length
            while (this.readThisMany > 0) {
                this.$refs['wordRef' + (this.words.length-this.readThisMany)].animateOut()
                this.readThisMany--
            }
        },
    }


}
</script>


<style>
    .word-container-inner {
        flex-direction: row;
    }
    .word-container-outer {
        flex-direction: column;
    }
</style>