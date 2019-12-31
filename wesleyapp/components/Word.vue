<template>
    <touchable-opacity :onPress="manualReadWord">
        <animated:view
            :style="[{maxHeight: maxGrowth,
                    maxWidth: maxGrowth,
                    minWidth: minGrowth,
                    minHeight: minGrowth,
                    paddingTop: paddingGrowth,
                    paddingBottom: pic ? 0 : paddingGrowth,
                    paddingRight: pic ? 0 : paddingGrowth,
                    paddingLeft: pic ? 0 : paddingGrowth,
                    opacity: opacityGrowth,},
                    roundBox]"
            :class="{'blue-box':!tutorialHighlight && !tutorialFade, 'red-box':tutorialHighlight, 'fade-box':tutorialFade}"
            class="column m-03">
            <view class="row">
                <text
                    v-if="highlightedText"
                    :numberOfLines="1"
                    :style="{fontSize: fontSize}"
                    :class="{'highlighted-text':!tutorialHighlight, 'highlighted-text-red':tutorialHighlight}">
                    {{ highlightedText }}
                </text>
                <text
                    :numberOfLines="1"
                    :style="{fontSize: fontSize}"
                    :class="{'normal-text':!tutorialFade, 'normal-text-fade':tutorialFade}">
                    {{ normalText }}
                </text>
            </view>
            <image
                v-if="pic"
                :style="{height: 248 * sizeFactor, width: 139 * sizeFactor, resizeMode: 'stretch', marginTop: paddingSizeSmall, opacity: tutorialFade ? 0.33 : 1}"
                :source="pic.source"
                :onError="() => invalidatePicture(pic.name)">
        </view>
    </touchable-opacity>
</template>

<script>
import { Animated, Easing } from "react-native"
import { mapGetters, mapActions } from 'vuex'

export default {    
    props: {
        word: {
            type: String,
            required: true
        },
        continueSentence: {
            type: Function,
            required: true
        },
        narrating: {
            type: Boolean,
            required: true
        },
        wordPressed: {
            type: Function,
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
        tutorialHighlight: {
            type: Boolean,
            default: false
        },
        tutorialFade: {
            type: Boolean,
            default: false
        },
        picName: {
            type: String,
            default: undefined
        },
        unhighlightDuringNarration: {
            type: Boolean,
            default: false
        },
        fadeAnimations: {
            type: Boolean,
            default: false
        },
        finishedAnimating: {
            type: Function,
            default: () => {},
        }
    },

    data () {
        return {
            normalText: this.word,
            highlightedText: "",
            reading: false,
            highlighting: false,
            maxGrowth: new Animated.Value(0),
            minGrowth: new Animated.Value(0),
            paddingGrowth: new Animated.Value(0),
            opacityGrowth: new Animated.Value(0),
            stuff: 0,
        }
    },

    mounted () {
        var size = 300 * this.sizeFactor
        var padding = this.paddingSize
        if (this.pic) {
            size = 500 * this.sizeFactor
            padding = this.paddingSizeSmall
        }

        // we want to fade in the word on special occasion
        if (this.fadeAnimations) {
            this.maxGrowth.setValue(size)
            this.paddingGrowth.setValue(padding)
            this.animateOpacity(1)
        }
        else {
            this.opacityGrowth.setValue(1)
            this.animateGrowth(size, padding)
        }
    },

    computed: {
        pic () {
            if (this.picName) {
                return this.getPicture(this.picName)
            }
            else {
                return null
            }
        },

        ...mapGetters([
            'roundBox',
            'sizeFactor',
            'highlightSpeed',
            'fontSize',
            'paddingSize',
            'paddingSizeSmall',
            'getPicture'
        ]),
    },

    methods: {
        ...mapActions([
            'afterSpeak',
            'invalidatePicture'
        ]),
        
        animateGrowth (max, padding) {
            var time = 500
            if (this.pic) {
                time = 800
            }
            // Animate the word in, going from 0 size to full
            Animated.parallel([
                Animated.timing(this.maxGrowth, {
                    toValue: max,
                    duration: time,
                }),
                Animated.timing(this.paddingGrowth, {
                    toValue: padding,
                    duration: time,
                })
            ]).start(this.finishedAnimating)
        },
        
        animateOpacity (value) {
            var time = 1000
            // Fade the letter in/out
            Animated.parallel([
                Animated.timing(this.opacityGrowth, {
                    toValue: value,
                    duration: time,
                })
            ]).start(this.finishedAnimating)
        },

        animateOut () {
            // we want to fade out the word on special occasion
            if (this.fadeAnimations) {
                this.animateOpacity(0)
            }
            else {
                this.animateGrowth(0,0)
            }
        },

        highlightWord (callback) {
            // recursive call to highlight each letter in turn
            if (this.normalText) {
                setTimeout(() => {
                    this.highlightedText = this.highlightedText + this.normalText.charAt(0)
                    this.normalText = this.normalText.slice(1, this.normalText.length)
                    this.highlightWord(callback)
                }, this.highlightSpeed)
            }
            else {
                // we're reading a sentence, alert the parent that we've finished
                if (this.narrating) {
                    setTimeout(() => {
                        this.highlighting = false
                        this.finishReading(callback)
                    }, this.highlightSpeed)
                }
                // we're reading just this word, clean up
                else {
                    setTimeout(() => {
                        this.clearHighlight(callback)
                    }, this.highlightSpeed*2)
                }
            }
        },

        clearHighlight (callback) {
            this.highlighting = false
            if (!this.narrating) {
                this.finishReadingPress(callback)
            }
            else {
                this.normalText = this.highlightedText
                this.highlightedText = ""
            }
        },

        finishReading (callback) {
            if (!this.reading && !this.highlighting) {
                if (this.unhighlightDuringNarration) {
                    this.clearHighlight()
                }
                if (callback) callback()
                else this.continueSentence()
            }
        },

        finishReadingPress (callback) {
            if (!this.reading && !this.highlighting) {
                this.normalText = this.highlightedText
                this.highlightedText = ""
                this.setManuallyReading(false)
                if (callback) callback()
                else this.wordPressed(this.normalText)
            }
        },

        readWord (callback) {
            this.reading = true
            this.highlighting = true
            this.highlightWord(callback)
            this.afterSpeak({
                word: this.word,
                callback: () => {
                    this.reading = false
                    if (this.narrating) {
                        this.finishReading(callback)
                    }
                    else {
                        this.finishReadingPress(callback)
                    }
                }
            })
        },

        manualReadWord () {
            if (!this.manuallyReading) {
                this.setManuallyReading(true)
                this.readWord()
            }
        }
    }


}
</script>


<style>
    .word-container {
        flex-direction: row;
    }

    .highlighted-text {
        color: blue;
        background-color: yellow;
    }
    .normal-text {
        color: white;
    }
    .normal-text-fade {
        color: rgba(255, 255, 255, 0.4);
    }

    .highlighted-text-red {
        color: red;
        background-color: yellow;
    }

    .m-03 {
        margin: 3
    }

    .blue-box {
        background-color: 'rgb(0, 119, 179)';
    }

    .red-box {
        background-color: 'rgb(217, 56, 56)';
    }

    .fade-box {
        background-color: 'rgba(0, 119, 179, 0.4)';
    }

    
    .row {
        flex-direction: row;
    }
    .column {
        flex-direction: column;
    }
</style>