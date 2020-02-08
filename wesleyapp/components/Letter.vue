<template>
    <touchable-opacity :onPress="manualReadLetter" :disabled="disabled">
        <animated:view
            :style="{opacity: opacityGrowth,
                    borderTopLeftRadius: radiusLeftGrowth,
                    borderTopRightRadius: radiusRightGrowth,
                    borderBottomLeftRadius: radiusLeftGrowth,
                    borderBottomRightRadius: radiusRightGrowth,
                    paddingTop: paddingMod,
                    paddingBottom: paddingMod,
                    paddingLeft: paddingLeftGrowth,
                    paddingRight: paddingRightGrowth,
                    marginLeft: marginGrowth,
                    marginRight: marginGrowth,
                    marginTop: 3,
                    marginBottom: 3 }"
            :class="{'blue-box':!tutorialHighlight && !tutorialFade, 'red-box':tutorialHighlight, 'fade-box':tutorialFade}">
            <view>
                <text
                    :numberOfLines="1"
                    :style="{fontSize: fontSize}"
                    :class="{'normal-text':!tutorialFade && !highlighted,
                            'normal-text-fade':tutorialFade && !highlighted,
                            'highlighted-text':!tutorialHighlight && highlighted,
                            'highlighted-text-red':tutorialHighlight && highlighted}">
                    {{ letter }}
                </text>
            </view>
        </view>
    </touchable-opacity>
</template>

<script>
import { Animated, Easing } from "react-native"
import { mapGetters, mapActions } from 'vuex'
import Vue from 'vue-native-core'

export default {    
    props: {
        letter: {
            type: String,
            required: true
        },
        continueSequence: {
            type: Function,
            required: true
        },
        narrating: {
            type: Boolean,
            required: true
        },
        letterPressed: {
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
        unhighlightDuringNarration: {
            type: Boolean,
            default: false
        },
        // Defines the position of this letter in the WordMadeOfLetters
        // If none === no special treatment, all padding and all rounded borders
        // If right === gets right padding and rounded right border
        // If left === gets left padding and rounded left border
        // If center === gets no horizontal padding and no rounded borders
        position: {
            type: String,
            default: "none"
        },
        transparent: {
            type: Boolean,
            default: false
        },
        startSplit: {
            type: Boolean,
            default: false
        },
        fadeIn: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        },
        finishedAnimating: {
            type: Function,
            default: () => {},
        },
        noExpand: {
            type: Boolean,
            default: false,
        }
    },

    data () {
        return {
            reading: false,
            highlighted: false,
            paddingLeftGrowth: new Animated.Value(0),
            paddingRightGrowth:  new Animated.Value(0),
            opacityGrowth: new Animated.Value(0),
            radiusLeftGrowth: new Animated.Value(0),
            radiusRightGrowth: new Animated.Value(0),
            marginGrowth: new Animated.Value(0),
            paddingMod: new Animated.Value(0),
            hidden: false,
            animated: Animated,
            finishedAnimation: false,
            queuedAnimation: null,
        }
    },

    created () {
        this.paddingMod.setValue(this.paddingSize)

        // we assume letters constructing a word are opaque unless specified
        if (!this.transparent && !this.fadeIn) {
            this.opacityGrowth.setValue(1)
        }
        else {
            this.hidden = true
        }

        // set the initial values based on position in the word (or if not in a word)
        if (this.position === 'none' || this.startSplit ) {
            this.paddingLeftGrowth.setValue(this.paddingSize)
            this.paddingRightGrowth.setValue(this.paddingSize)
            this.radiusLeftGrowth.setValue(this.radiusSize)
            this.radiusRightGrowth.setValue(this.radiusSize)
            this.marginGrowth.setValue(10)
        }
        else if (this.position === 'left') {
            this.paddingLeftGrowth.setValue(this.paddingSize)
            this.radiusLeftGrowth.setValue(this.radiusSize)
        }
        else if (this.position === 'right') {
            this.paddingRightGrowth.setValue(this.paddingSize)
            this.radiusRightGrowth.setValue(this.radiusSize)
        }
    },

    mounted () {
        if (this.fadeIn) {
            this.animateOpacity(1)
        }
    },

    computed: {
        ...mapGetters([
            'borderSize',
            'fontSize',
            'paddingSize',
            'radiusSize'
        ]),
    },

    methods: {
        ...mapActions([
            'afterSpeak'
        ]),
        
        animateOpacity (value) {
            if (value === 0) {
                this.hidden = true
            }
            if (value === 1) {
                this.hidden = false
            }
            var time = 1000
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
            this.animateOpacity(0)
        },

        // This is called when the letter is part of a WordMadeOfLetters, and the parent wants this letter to seperate
        // This causes the letter to form into a normal letter, like one with position === 'none'
        // This means the letters gains border radius, padding, and margins on all sides
        becomeSeperated () {
            var time = 1000
            Animated.parallel([
                Animated.timing(this.paddingLeftGrowth, {
                    toValue: this.paddingSize,
                    duration: time,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
                Animated.timing(this.paddingRightGrowth, {
                    toValue: this.paddingSize,
                    duration: time,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
                Animated.timing(this.radiusLeftGrowth, {
                    toValue: this.radiusSize,
                    duration: time,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
                Animated.timing(this.radiusRightGrowth, {
                    toValue: this.radiusSize,
                    duration: time,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
                Animated.timing(this.marginGrowth, {
                    toValue: 10,
                    duration: time,
                    easing: Easing.linear,
                    useNativeDriver: false,
                })
            ]).start(this.finishedAnimating)
        },

        // This is called when the letter is part of a WordMadeOfLetters, and the parent wants this letter to revert to its original look
        // This means the letters loses any of its gained border radius, padding, and margins on all sides
        reverseSeperation () {
            var time = 1000
            var paddingRight = this.paddingSize
            var paddingLeft = this.paddingSize
            var radiusRight = this.radiusSize
            var radiusLeft = this.radiusSize

            if (this.position === 'left') {
                paddingRight = 0
                radiusRight = 0
            }
            else if (this.position === 'right') {
                paddingLeft = 0
                radiusLeft = 0
            }
            else if (this.position === 'center') {
                paddingLeft = 0
                paddingRight = 0
                radiusLeft = 0
                radiusRight = 0
            }

            Animated.parallel([
                Animated.timing(this.paddingLeftGrowth, {
                    toValue: paddingLeft,
                    duration: time,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
                Animated.timing(this.paddingRightGrowth, {
                    toValue: paddingRight,
                    duration: time,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
                Animated.timing(this.radiusLeftGrowth, {
                    toValue: radiusLeft,
                    duration: time,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
                Animated.timing(this.radiusRightGrowth, {
                    toValue: radiusRight,
                    duration: time,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
                Animated.timing(this.marginGrowth, {
                    toValue: 0,
                    duration: time,
                    easing: Easing.linear,
                    useNativeDriver: false,
                })
            ]).start(this.finishedAnimating)
        },
        
        widenLetter () {
            Vue.nextTick(() => {
                var time = 300
                // Animate the letter as we read it, making it inflate
                Animated.parallel([
                    Animated.timing(this.paddingMod, {
                        toValue: this.paddingSize + 20,
                        duration: time,
                        useNativeDriver: false,
                    }),
                ]).start(this.finishWiden)
            })
        },
        
        shrinkLetter (keepManualReading, shouldUnhighlight) {
            shrinkAnimation = () => {
                Vue.nextTick(() => {
                    var time = 300
                    // Animate the letter after we read it, making it deflate
                    Animated.parallel([
                        Animated.timing(this.paddingMod, {
                            toValue: this.paddingSize + 0,
                            duration: time,
                            useNativeDriver: false,
                        }),
                    ])
                    .start(() => { 
                        if (!keepManualReading) this.setManuallyReading(false)
                        if (shouldUnhighlight) this.highlighted = false
                    })
                })
            }
            if (this.finishedAnimation) {
                this.finishedAnimation = false
                shrinkAnimation()
            }
            else {
                this.queuedAnimation = shrinkAnimation
            }
        },

        finishWiden () {
            if (this.queuedAnimation) {
                this.queuedAnimation()
                this.queuedAnimation = null
            }
            else {
                this.finishedAnimation = true
            }
        },

        readLetter (callback, unhighlight) {
            this.highlighted = true
            if (!this.noExpand) this.widenLetter()
            this.afterSpeak({
                word: this.letter,
                callback: () => {
                    let shouldUnhighlight = false
                    if (this.narrating) {
                        if (this.unhighlightDuringNarration || unhighlight) {
                          shouldUnhighlight = true
                          if (this.noExpand) {
                            this.highlighted = false
                          }
                        }
                        if (callback) callback()
                        else this.continueSequence()
                    }
                    else {
                        shouldUnhighlight = true
                        if (this.noExpand) {
                          this.highlighted = false
                        }
                        if (callback) callback()
                        else this.letterPressed(this.letter)
                    }
                    if (!this.noExpand) this.shrinkLetter(this.narrating, shouldUnhighlight)
                }
            })
        },

        manualReadLetter () {
            if (!this.manuallyReading && !this.hidden) {
                this.setManuallyReading(true)
                this.readLetter()
            }
        },

        highlightLetter () {
            this.highlighted = true
        },

        unhighlightLetter () {
            this.highlighted = false
        },
    }


}
</script>


<style>
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
</style>