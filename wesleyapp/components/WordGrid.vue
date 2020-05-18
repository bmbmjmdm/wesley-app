<template>
    <view class="word-container-outer">
        <view class="word-container-inner">
            <Word
                :style="wordMargin"
                :key="words[0].targetWord + 0 + words"
                :ref="'wordRef0'"
                :word="words[0].targetWord"
                :picName="showPictures ? words[0].targetWord : null"
                :narrating="narrating"
                :continueSentence="readWords"
                :word-pressed="wordPressed"
                :manually-reading="manuallyReading"
                :set-manually-reading="setManuallyReading"
                :tutorialHighlight="tutorial && words[0].targetWord === targetWord"
                :tutorialFade="tutorial && words[0].targetWord !== targetWord"
                :unhighlightDuringNarration="true"
                :finishedAnimating="finishedAnimating" /> 
            <Word
                :style="wordMargin"
                :key="words[1].targetWord + 1 + words"
                :ref="'wordRef1'"
                :word="words[1].targetWord"
                :picName="showPictures ? words[1].targetWord : null"
                :narrating="narrating"
                :continueSentence="readWords"
                :word-pressed="wordPressed"
                :manually-reading="manuallyReading"
                :set-manually-reading="setManuallyReading"
                :tutorialHighlight="tutorial && words[1].targetWord === targetWord"
                :tutorialFade="tutorial && words[1].targetWord !== targetWord"
                :unhighlightDuringNarration="true"
                :finishedAnimating="finishedAnimating" />
        </view>
        <view class="word-container-inner">
            <Word
                :style="wordMargin"
                :key="words[2].targetWord + 2 + words"
                :ref="'wordRef2'"
                :word="words[2].targetWord"
                :picName="showPictures ? words[2].targetWord : null"
                :narrating="narrating"
                :continueSentence="readWords"
                :word-pressed="wordPressed"
                :manually-reading="manuallyReading"
                :set-manually-reading="setManuallyReading"
                :tutorialHighlight="tutorial && words[2].targetWord === targetWord"
                :tutorialFade="tutorial && words[2].targetWord !== targetWord"
                :unhighlightDuringNarration="true"
                :finishedAnimating="finishedAnimating" />
            <Word
                :style="wordMargin"
                :key="words[3].targetWord + 3 + words"
                :ref="'wordRef3'"
                :word="words[3].targetWord"
                :picName="showPictures ? words[3].targetWord : null"
                :narrating="narrating"
                :continueSentence="readWords"
                :word-pressed="wordPressed"
                :manually-reading="manuallyReading"
                :set-manually-reading="setManuallyReading"
                :tutorialHighlight="tutorial && words[3].targetWord === targetWord"
                :tutorialFade="tutorial && words[3].targetWord !== targetWord"
                :unhighlightDuringNarration="true"
                :finishedAnimating="finishedAnimating" />
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
        queuedCallback: {
            type: Function,
            default: () => {},
        },
        showPictures: {
            type: Boolean,
            required: true,
        }
    },

    data () {
        return {
            readThisMany: 0,
            finishedAnimatingCount: 0,
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

        finishedAnimating () {
            this.finishedAnimatingCount++
            if (this.finishedAnimatingCount >= this.words.length) {
                this.finishedAnimatingCount = 0
                if (this.queuedCallback) {
                    this.queuedCallback()
                }
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