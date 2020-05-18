<template>
    <view
        class="container"
        :class="{'normal-shadow': showOptionsIntro}">
        <touchable-opacity
            v-if="showOptionsIntro"
            class="top-of-screen"
            :style="{padding: 25 * sizeFactor}"
            :onPress="nextIntro">
            <text
                class="normal-text"
                :style="{fontSize: fontSize}"
                :allowFontScaling="false">
                {{ introText }}
            </text>
        </touchable-opacity>
        <touchable-opacity
            v-if="!showOptionsIntro"
            :onPress="() => back()"
            :class="{'blue-box': !showOptionsIntro, 'blue-shadow': showOptionsIntro}"
            :style="[{paddingTop: paddingSize,
                    paddingBottom: paddingSize,
                    paddingRight: paddingSize * 1.5,
                    paddingLeft: paddingSize * 1.5 },
                    roundBox]">
            <text 
                :style="{fontSize: fontSize}"
                :class="{'normal-text': !showOptionsIntro, 'normal-text-shadow': showOptionsIntro}">
                Back
            </text>
        </touchable-opacity>
        <touchable-opacity
            :class="{'white-box': !showOptionsIntro || introStep == 0, 'white-shadow': showOptionsIntro && introStep != 0}"
            :onPress="() => cycleTopics()"
            :style="[{padding: paddingSizeSmall, marginTop: 30 * sizeFactor}, roundBox]">
            <text 
                :style="{fontSize: fontSizeSmall}"
                :class="{'link-text': !showOptionsIntro || introStep == 0, 'link-text-shadow': showOptionsIntro && introStep != 0}">
                {{ topicText }}
            </text>
        </touchable-opacity>
        <touchable-opacity
            v-if="allowedTopics.includes('reading')"
            :class="{'white-box': !showOptionsIntro || introStep == 1, 'white-shadow': showOptionsIntro && introStep != 1}"
            :onPress="() => cycleDifficultyReading()"
            :style="[{padding: paddingSizeSmall, marginTop: 30 * sizeFactor}, roundBox]">
            <text 
                :style="{fontSize: fontSizeSmall}"
                :class="{'link-text': !showOptionsIntro || introStep == 1, 'link-text-shadow': showOptionsIntro && introStep != 1}">
                {{ difficultyTextReading }}
            </text>
        </touchable-opacity>
        <touchable-opacity
            v-if="allowedTopics.includes('spelling')"
            :class="{'white-box': !showOptionsIntro || introStep == 1, 'white-shadow': showOptionsIntro && introStep != 1}"
            :onPress="() => cycleDifficultySpelling()"
            :style="[{padding: paddingSizeSmall, marginTop: 30 * sizeFactor}, roundBox]">
            <text 
                :style="{fontSize: fontSizeSmall}"
                :class="{'link-text': !showOptionsIntro || introStep == 1, 'link-text-shadow': showOptionsIntro && introStep != 1}">
                {{ difficultyTextSpelling }}
            </text>
        </touchable-opacity>
    </view>
</template>

<script>
import { difficulty } from './store'
import { mapGetters, mapMutations } from 'vuex'

export default {
    data () {
        return {
            introStep: -1,
        }
    },

    created () {
        if (this.showOptionsIntro) {
            this.introStep = 0
        }
    },

    computed: {
        difficultyTextReading () {
            if (this.difficultyReading === difficulty.VERY_EASY) return "Reading: All Hints"
            else if (this.difficultyReading === difficulty.EASY) return "Reading: Lots of Hints"
            else if (this.difficultyReading === difficulty.MEDIUM) return "Reading: Some Hints"
            else if (this.difficultyReading === difficulty.HARD) return "Reading: No Hints"
        },

        difficultyTextSpelling () {
            if (this.difficultySpelling === difficulty.VERY_EASY) return "Spelling: All Hints"
            else if (this.difficultySpelling === difficulty.EASY) return "Spelling: Lots of Hints"
            else if (this.difficultySpelling === difficulty.MEDIUM) return "Spelling: Some Hints"
            else if (this.difficultySpelling === difficulty.HARD) return "Spelling: No Hints"
        },

        topicText () {
            if (this.allowedTopics === 'reading') return "Reading only"
            else if (this.allowedTopics === "spelling") return "Spelling only"
            else return "Reading and Spelling"
        },

        introText () {
            switch(this.introStep) {
                case 0:
                    return "Use this button to toggle which topic(s) you want taught"
                    break;
                case 1:
                    return "Use these to change how difficult the activities are. If you're unsure, set the difficulty and try it. As your child does better or worse, the difficulty will change automatically"
                    break;
            } 
        },
        
        ...mapGetters([
            'roundBox',
            'difficultySpelling',
            'difficultyReading',
            'allowedTopics',
            'paddingSize',
            'paddingSizeSmall',
            'fontSizeSmall',
            'fontSize',
            'showOptionsIntro',
            'sizeFactor'
        ]),
    },

    methods: {
        ...mapMutations([
            'setDifficultySpelling',
            'setDifficultyReading',
            'setAllowedTopics',
            'finishOptionsIntro',
            'setActivity'
        ]),
    
        nextIntro () {
            this.introStep++
            if (this.introStep > 1) {
                this.finishOptionsIntro()
            }
        },

        back () {
            if (this.showOptionsIntro) return
            this.setActivity({name: 'home'})
        },

        cycleDifficultyReading () {
            if (this.showOptionsIntro) {
                if (this.introStep === 1) this.nextIntro()
                return
            }
            var diff = this.difficultyReading
            diff++
            if (diff > difficulty.HARD) {
                diff = difficulty.VERY_EASY
            }
            this.setDifficultyReading(diff)
        },

        cycleDifficultySpelling () {
            if (this.showOptionsIntro) {
                if (this.introStep === 1) this.nextIntro()
                return
            }
            var diff = this.difficultySpelling
            diff++
            if (diff > difficulty.HARD) {
                diff = difficulty.VERY_EASY
            }
            this.setDifficultySpelling(diff)
        },

        cycleTopics () {
            if (this.showOptionsIntro) {
                if (this.introStep === 0) this.nextIntro()
                return
            }
            if (this.allowedTopics === "reading") {
                this.setAllowedTopics("spelling")
            }
            else if (this.allowedTopics === "spelling") {
                this.setAllowedTopics("reading spelling")
            }
            else {
                this.setAllowedTopics("reading")
            }
        },
    }


}
</script>


<style>
    .container {
        align-items: center;
        justify-content: center;
        flex: 1;
        flex-direction: column;
    }

    .blue-box {
        background-color: 'rgb(0, 119, 179)';
    }

    .blue-shadow {
        background-color: 'rgb(0, 36, 54)' !important;
    }

    .white-box {
        background-color: 'rgb(255, 255, 255)';
    }

    .white-shadow {
        background-color: 'rgb(76, 76, 76)';
    }

    .link-text {
        color: 'rgb(0, 119, 179)';
    }

    .link-text-shadow {
        color: 'rgb(0, 36, 54)';
    }

    .normal-text {
        color: white;
    }

    .normal-text-shadow {
        color: 'rgb(76, 76, 76)';
    }

    .normal-shadow {
        background-color: 'rgba(0, 0, 0, 0.7)' !important;
    }

    .top-of-screen {
        position: absolute;
        top: 0;
    }


</style>