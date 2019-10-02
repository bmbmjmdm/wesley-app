<template>
    <touchable-opacity
        :onPress="manualReadWord"
        :style="shadow">
        <animated:view
            :style="{maxHeight: maxGrowth,
                    maxWidth: maxGrowth,
                    minWidth: minGrowth,
                    minHeight: minGrowth,
                    paddingTop: paddingGrowth,
                    paddingBottom: pic ? 0 : paddingGrowth,
                    paddingRight: pic ? 0 : paddingGrowth,
                    paddingLeft: pic ? 0 : paddingGrowth,}"
            :class="{'blue-box':!tutorialHighlight && !tutorialFade, 'red-box':tutorialHighlight, 'fade-box':tutorialFade}"
            class="column">
            <view class="row">
                <text
                    v-if="highlightedText"
                    :numberOfLines="1"
                    :class="{'highlighted-text':!tutorialHighlight, 'highlighted-text-red':tutorialHighlight}">
                    {{ highlightedText }}
                </text>
                <text
                    :numberOfLines="1"
                    :class="{'normal-text':!tutorialFade, 'normal-text-fade':tutorialFade}">
                    {{ normalText }}
                </text>
            </view>
            <image
                v-if="pic"
                :style="{height: 248, width: 139, resizeMode: 'stretch', marginTop: 15, opacity: tutorialFade ? 0.33 : 1}"
                :source="pic">
        </view>
    </touchable-opacity>
</template>

<script>
import afterSpeak from './afterSpeak'
import { Animated, Easing } from "react-native";

export default {    
    props: {
        word: {
            type: String,
            required: true
        },
        highlightSpeed: {
            type: Number,
            required: true
        },
        textToSpeech: {
            type: Object,
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
        pic: {
            type: Number,
            default: undefined
        },
        unhighlightDuringNarration: {
            type: Boolean,
            default: false
        },
        shadow: {
            type: Object,
            required: true
        },
    },

    data () {
        return {
            normalText: this.word,
            highlightedText: "",
            reading: false,
            highlighting: false,
            maxGrowth: new Animated.Value(0),
            minGrowth: new Animated.Value(0),
            paddingGrowth: new Animated.Value(0)
        }
    },
    mounted () {
        var size = 300
        var padding = 30
        if (this.pic) {
            size = 500
            padding = 15
        }
        this.animateGrowth(size, padding)
    },

    methods: {
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
            ]).start()
        },

        animateOut () {
            this.animateGrowth(0,0)
        },

        highlightWord () {
            // recursive call to highlight each letter in turn
            if (this.normalText) {
                setTimeout(() => {
                    this.highlightedText = this.highlightedText + this.normalText.charAt(0)
                    this.normalText = this.normalText.slice(1, this.normalText.length)
                    this.highlightWord()
                }, this.highlightSpeed)
            }
            else {
                // we're reading a sentence, alert the parent that we've finished
                if (this.narrating) {
                    setTimeout(() => {
                        this.highlighting = false
                        this.finishReading()
                    }, this.highlightSpeed)
                }
                // we're reading just this word, clean up
                else {
                    setTimeout(() => {
                        this.clearHighlight()
                    }, this.highlightSpeed*2)
                }
            }
        },

        clearHighlight () {
            this.highlighting = false
            if (!this.narrating) {
                this.finishReadingPress()
            }
            else {
                this.normalText = this.highlightedText
                this.highlightedText = ""
            }
        },

        finishReading () {
            if (!this.reading && !this.highlighting) {
                if (this.unhighlightDuringNarration) {
                    this.clearHighlight()
                }
                this.continueSentence()
            }
        },

        finishReadingPress () {
            if (!this.reading && !this.highlighting) {
                this.normalText = this.highlightedText
                this.highlightedText = ""
                this.setManuallyReading(false)
                this.wordPressed(this.normalText)
            }
        },

        readWord () {
            this.reading = true
            this.highlighting = true
            this.highlightWord()
            afterSpeak(this.textToSpeech, this.word, () => {
                this.reading = false
                if (this.narrating) {
                    this.finishReading()
                }
                else {
                    this.finishReadingPress()
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
        font-size: 40;
    }
    .normal-text {
        color: white;
        font-size: 40;
    }
    .normal-text-fade {
        color: rgba(255, 255, 255, 0.33);
        font-size: 40;
    }

    .highlighted-text-red {
        color: red;
        background-color: yellow;
        font-size: 40;
    }

    .blue-box {
        background-color: 'rgb(0, 119, 179)';
        margin: 3;
        border-radius: 20;
        elevation: 5;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        overflow: hidden
    }

    .red-box {
        background-color: 'rgb(217, 56, 56)';
        margin: 3;
        border-radius: 20;
        elevation: 5;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        overflow: hidden
    }

    .fade-box {
        background-color: 'rgba(0, 119, 179, 0.33)';
        margin: 3;
        border-radius: 20;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    
    .row {
        flex-direction: row;
    }
    .column {
        flex-direction: column;
    }
</style>