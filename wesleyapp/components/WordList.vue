<template>
    <view class="word-container">
        <Word
            v-for="(word,index) in list"
            class="mb-3"
            :key="word+index+list"
            :ref="'wordRef'"
            :word="word"
            :narrating="narrating"
            :continueSentence="readWords"
            :word-pressed="wordPressed"
            :manually-reading="manuallyReading"
            :set-manually-reading="setManuallyReading"
            :tutorialHighlight="tutorial && word === targetWord"
            :tutorialFade="tutorial && word !== targetWord"
            :unhighlightDuringNarration="true"
            :fadeAnimations="true" />
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
    },

    data () {
        return {
            readThisMany: 0,
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
            this.readThisMany = this.list.length
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
        flex-direction: column;
        flex-wrap: wrap;
    }
    .mb-3 {
        margin-bottom: 15
    }
</style>