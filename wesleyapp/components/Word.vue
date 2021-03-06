<template>
    <touchable-opacity :onPress="manualReadWord">
        <animated:view
            :style="[{margin: 3 * sizeFactor,
                    maxHeight: maxGrowth._value,
                    maxWidth: maxGrowth._value,
                    minWidth: minGrowth._value,
                    minHeight: minGrowth._value,
                    paddingTop: paddingGrowthTop._value,
                    paddingBottom: paddingGrowthBot._value,
                    paddingRight: pic ? 0 : paddingGrowthSide._value,
                    paddingLeft: pic ? 0 : paddingGrowthSide._value,
                    opacity: opacityGrowth._value,},
                    roundBox]"
            :class="{'blue-box':!tutorialHighlight && !tutorialFade, 'red-box':tutorialHighlight, 'fade-box':tutorialFade}"
            class="column">
            <view
                v-if="word.length < 8"
                class="row">
                <text
                    v-if="highlightedText"
                    :numberOfLines="1"
                    ellipsizeMode="clip"
                    :style="{fontSize: fontSize}"
                    :class="{'highlighted-text':!tutorialHighlight, 'highlighted-text-red':tutorialHighlight}">
                    {{ highlightedText }}
                </text>
                <text
                    :numberOfLines="1"
                    ellipsizeMode="clip"
                    :style="{fontSize: fontSize}"
                    :class="{'normal-text':!tutorialFade, 'normal-text-fade':tutorialFade}">
                    {{ normalText }}
                </text>
            </view>
            <!--- This is needed because of React Native's wierd text wrapping requirements. Long words need all letters displayed individually to avoid wrapping --->
            <view
                v-else
                class="row">
                <text
                    v-for="highlight in highlightedText"
                    :style="{fontSize: fontSize}"
                    :class="{'highlighted-text':!tutorialHighlight, 'highlighted-text-red':tutorialHighlight}">
                    {{ highlight }}
                </text>
                <text
                    v-for="letter in normalText"
                    :style="{fontSize: fontSize}"
                    :class="{'normal-text':!tutorialFade, 'normal-text-fade':tutorialFade}">
                    {{ letter }}
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
        },
        skipShrink: {
            type: Boolean,
            default: false
        },
        animationSpeedFactor: {
            type: Number,
            default: 1,
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
            paddingGrowthTop: new Animated.Value(0),
            paddingGrowthBot: new Animated.Value(0),
            paddingGrowthSide: new Animated.Value(0),
            opacityGrowth: new Animated.Value(0),
            defaultPaddingTop: 0,
            defaultPaddingBot: 0,
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
            this.paddingGrowthTop.setValue(padding)
            this.paddingGrowthSide.setValue(padding)
            if (!this.pic) {
                this.paddingGrowthBot.setValue(padding)
                this.defaultPaddingBot = padding
            }
            this.defaultPaddingTop = padding
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
            var time = 500 * this.animationSpeedFactor
            if (this.pic) {
                time = 800 * this.animationSpeedFactor
            }

            this.defaultPaddingTop = padding

            let animationList = [
                Animated.timing(this.maxGrowth, {
                    toValue: max,
                    duration: time,
                    useNativeDriver: false,
                }),
                Animated.timing(this.paddingGrowthSide, {
                    toValue: padding,
                    duration: time,
                    useNativeDriver: false,
                }),
                Animated.timing(this.paddingGrowthTop, {
                    toValue: padding,
                    duration: time,
                    useNativeDriver: false,
                }),
            ]

            if (!this.pic) {
                animationList.push(
                    Animated.timing(this.paddingGrowthBot, {
                        toValue: padding,
                        duration: time,
                        useNativeDriver: false,
                    })
                )
                this.defaultPaddingBot = padding
            }

            // Animate the word in, going from 0 size to full
            Animated.parallel(animationList).start(this.finishedAnimating)
        },
        
        widenWord () {
            var time = 300 * this.animationSpeedFactor
            // Animate the word as we read it, making it inflate
            Animated.parallel([
                Animated.timing(this.paddingGrowthTop, {
                    toValue: this.defaultPaddingTop + Math.round(20 * this.sizeFactor),
                    duration: time,
                    useNativeDriver: false,
                }),
                Animated.timing(this.paddingGrowthBot, {
                    toValue: this.defaultPaddingBot + Math.round(20 * this.sizeFactor),
                    duration: time,
                    useNativeDriver: false,
                }),
            ]).start()
        },
        
        shrinkWord (callback) {
            var time = 300 * this.animationSpeedFactor
            // Animate the word after we read it, making it deflate
            Animated.parallel([
                Animated.timing(this.paddingGrowthTop, {
                    toValue: this.defaultPaddingTop,
                    duration: time,
                    useNativeDriver: false,
                }),
                Animated.timing(this.paddingGrowthBot, {
                    toValue: this.defaultPaddingBot,
                    duration: time,
                    useNativeDriver: false,
                }),
            ]).start(callback)
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
                }, this.highlightSpeed(this.word))
            }
            else {
                // we're reading a sentence, alert the parent that we've finished
                if (this.narrating) {
                    setTimeout(() => {
                        this.highlighting = false
                        this.finishReading(callback)
                    }, this.highlightSpeed(this.word))
                }
                // we're reading just this word, clean up
                else {
                    setTimeout(() => {
                        this.clearHighlight(callback)
                    }, this.highlightSpeed(this.word)*2)
                }
            }
        },

        clearHighlight (callback) {
            this.highlighting = false
            if (!this.narrating) {
                this.finishReadingPress(callback)
            }
            else {
                this.normalText = this.word
                this.highlightedText = ""
            }
        },

        finishReading (callback) {
            if (!this.reading && !this.highlighting) {
                if (!this.skipShrink) {
                    this.shrinkWord(() => {
                        if (this.unhighlightDuringNarration) {
                            if (this.narrating) {
                                this.normalText = this.word
                                this.highlightedText = ""
                            }
                        }
                    })
                }
                if (this.unhighlightDuringNarration) {
                    this.highlighting = false
                    if (!this.narrating) {
                        this.finishReadingPress(callback)
                    }
                }
                if (callback) callback()
                else this.continueSentence()
            }
        },

        finishReadingPress (callback) {
            if (!this.reading && !this.highlighting) {
                if (!this.skipShrink) {
                    this.shrinkWord(() => { 
                        this.setManuallyReading(false)
                        this.normalText = this.word
                        this.highlightedText = ""
                    })
                }
                if (callback) callback()
                else this.wordPressed(this.word)
            }
        },

        readWord (callback) {
            this.reading = true
            this.highlighting = true
            this.widenWord()
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
        },

        startHighlightRepeating () {
            this.highlightRepeatingOn = true
            this.highlightRepeating()
        },

        highlightRepeating () {
            setTimeout(() => {
                this.normalText = this.word
                this.highlightedText = ""
                if (this.highlightRepeatingOn) {
                    this.highlightWord(this.highlightRepeating)
                }
            }, 250)
        },

        stopHighlightRepeating () {
            this.highlightRepeatingOn = false
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