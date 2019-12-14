<template>
    <view class="container">
        <touchable-opacity
            :onPress="() => setActivity({name: 'home'})"
            class="blue-box"
            :style="[{paddingTop: paddingSize,
                    paddingBottom: paddingSize,
                    paddingRight: paddingSize * 1.5,
                    paddingLeft: paddingSize * 1.5 },
                    roundBox]">
            <text 
                :style="{fontSize: fontSize}"
                class="normal-text">
                Back
            </text>
        </touchable-opacity>
        <touchable-opacity
            class="white-box mt-6"
            :onPress="() => cycleTopics()"
            :style="[{padding: paddingSizeSmall}, roundBox]">
            <text 
                :style="{fontSize: fontSizeSmall}"
                class="link-text">
                {{ topicText }}
            </text>
        </touchable-opacity>
        <touchable-opacity
            v-if="allowedTopics.includes('reading')"
            class="white-box mt-6"
            :onPress="() => cycleDifficultyReading()"
            :style="[{padding: paddingSizeSmall}, roundBox]">
            <text 
                :style="{fontSize: fontSizeSmall}"
                class="link-text">
                {{ difficultyTextReading }}
            </text>
        </touchable-opacity>
        <touchable-opacity
            v-if="allowedTopics.includes('spelling')"
            class="white-box mt-6"
            :onPress="() => cycleDifficultySpelling()"
            :style="[{padding: paddingSizeSmall}, roundBox]">
            <text 
                :style="{fontSize: fontSizeSmall}"
                class="link-text">
                {{ difficultyTextSpelling }}
            </text>
        </touchable-opacity>
        <touchable-opacity
            class="white-box mt-6"
            :onPress="() => cycleAllowAutoAdjust()"
            :style="[{padding: paddingSizeSmall}, roundBox]">
            <text 
                :style="{fontSize: fontSizeSmall}"
                class="link-text">
                {{ allowAutoAdjustText }}
            </text>
        </touchable-opacity>
    </view>
</template>

<script>
import { difficulty } from './store'
import { mapGetters, mapMutations } from 'vuex'

export default {
    computed: {
        difficultyTextReading () {
            if (this.difficultyReading === difficulty.VERY_EASY) return "Reading: Very Easy"
            else if (this.difficultyReading === difficulty.EASY) return "Reading: Easy"
            else if (this.difficultyReading === difficulty.MEDIUM) return "Reading: Medium"
            else if (this.difficultyReading === difficulty.HARD) return "Reading: Hard"
        },

        difficultyTextSpelling () {
            if (this.difficultyReading === difficulty.VERY_EASY) return "Reading: Very Easy"
            else if (this.difficultySpelling === difficulty.EASY) return "Spelling: Easy"
            else if (this.difficultySpelling === difficulty.MEDIUM) return "Spelling: Medium"
            else if (this.difficultySpelling === difficulty.HARD) return "Spelling: Hard"
        },

        allowAutoAdjustText () {
            if (this.allowAutoAdjust) return "Auto Difficulty Adjustment ON"
            else return "Auto Difficulty Adjustment OFF"
        },

        topicText () {
            if (this.allowedTopics === 'reading') return "Reading only"
            else if (this.allowedTopics === "spelling") return "Spelling only"
            else return "Reading and Spelling"
        },
        
        ...mapGetters([
            'roundBox',
            'difficultySpelling',
            'difficultyReading',
            'allowAutoAdjust',
            'allowedTopics',
            'paddingSize',
            'paddingSizeSmall',
            'fontSizeSmall',
            'fontSize',
        ]),
    },

    methods: {
        ...mapMutations([
            'setDifficultySpelling',
            'setDifficultyReading',
            'setAllowAutoAdjust',
            'setAllowedTopics',
            'setActivity'
        ]),

        cycleDifficultyReading () {
            var diff = this.difficultyReading
            diff++
            if (diff > difficulty.HARD) {
                diff = difficulty.VERY_EASY
            }
            this.setDifficultyReading(diff)
        },

        cycleDifficultySpelling () {
            var diff = this.difficultySpelling
            diff++
            if (diff > difficulty.HARD) {
                diff = difficulty.VERY_EASY
            }
            this.setDifficultyReading(diff)
        },

        cycleAllowAutoAdjust () {
            this.setAllowAutoAdjust(!this.allowAutoAdjust)
        },

        cycleTopics () {
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

    .white-box {
        background-color: 'rgb(255, 255, 255)';
    }

    .link-text {
        color: 'rgb(0, 119, 179)';
    }

    .normal-text {
        color: white;
    }

    .mt-6 {
        margin-top: 30
    }
</style>