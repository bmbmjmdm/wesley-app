<template>
    <touchable-opacity :onPress="manualReadWord">
        <animated:image
            :style="{height: maxGrowth._value, width: maxGrowth._value, opacity: opacityGrowth._value, resizeMode: 'stretch'}"
            :source="pic">
    </touchable-opacity>
</template>

<script>
import { Animated, Easing } from "react-native"
import { mapGetters, mapActions } from 'vuex'
import speaker from '../assets/speaker.png'

export default {    
    props: {
        word: {
            type: String,
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
        fadeAnimations: {
            type: Boolean,
            default: false
        },
        finishedAnimating: {
            type: Function,
            default: () => {},
        },
        animationSpeedFactor: {
            type: Number,
            default: 1,
        }
    },

    data () {
        return {
            maxGrowth: new Animated.Value(0),
            opacityGrowth: new Animated.Value(0),
            animated: Animated,
            pic: speaker,
            allWords: [],
            animatingOut: false,
        }
    },

    mounted () {
        var size = 150 * this.sizeFactor

        // we want to fade in the word on special occasion
        if (this.fadeAnimations) {
            this.maxGrowth.setValue(size)
            this.animateOpacity(1)
        }
        else {
            this.opacityGrowth.setValue(1)
            this.animateGrowth(size)
        }
    },

    computed: {
        ...mapGetters([
            'sizeFactor',
        ]),
    },

    methods: {
        ...mapActions([
            'afterSpeak',
        ]),
        
        animateGrowth (max) {
            var time = 500 * this.animationSpeedFactor
            // Animate the word in, going from 0 size to full
            Animated.parallel([
                Animated.timing(this.maxGrowth, {
                    toValue: max,
                    duration: time,
                    useNativeDriver: false,
                }),
            ]).start(this.animateOutCallback)
        },
        
        animateOpacity (value) {
            var time = 1000 * this.animationSpeedFactor
            // Fade the letter in/out
            Animated.parallel([
                Animated.timing(this.opacityGrowth, {
                    toValue: value,
                    duration: time,
                    useNativeDriver: false,
                })
            ]).start(this.animateOutCallback)
        },

        animateOutCallback () {
            if (this.animatingOut) {
                this.finishedAnimating()
            }
        },

        animateOut () {
            this.animatingOut = true
            // we want to fade out the word on special occasion
            if (this.fadeAnimations) {
                this.animateOpacity(0)
            }
            else {
                this.animateGrowth(0,0)
            }
        },

        readWord () {
            // if we're given a sentence, we need to split it up and read the words sequentially
            this.allWords = this.word.split(' ')
            this.readWordLoop()
        },

        readWordLoop () {
            if (this.allWords.length > 0) {
                let readWord = this.allWords.shift()
                this.afterSpeak({
                    word: readWord,
                    callback: this.readWordLoop
                })
            }
            else {
                this.setManuallyReading(false)
            }
        },

        manualReadWord () {
            if (!this.manuallyReading) {
                this.setManuallyReading(true)
                this.readWord()
            }
        },
    }


}
</script>