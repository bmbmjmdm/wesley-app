<template>
    <view class="container">
        <touchable-opacity
            :onPress="() => changeActivity('home')"
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
            :onPress="() => cycleDifficulty()"
            :style="[{padding: paddingSizeSmall}, roundBox]">
            <text 
                :style="{fontSize: fontSizeSmall}"
                class="link-text">
                {{ difficultyText }}
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
import { mapGetters, mapMutations } from 'vuex'

export default {
    props: {
        changeActivity: {
            type: Function,
            required: true
        },
    },

    computed: {
        difficultyText () {
            if (this.difficulty === "easy") return "Easy difficulty"
            else if (this.difficulty === "medium") return "Medium difficulty"
            else if (this.difficulty === "hard") return "Hard difficulty"
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
            'difficulty',
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
            'setDifficulty',
            'setAllowAutoAdjust',
            'setAllowedTopics'
        ]),

        cycleDifficulty () {
            if (this.difficulty === "easy") {
                this.setDifficulty("medium")
            }
            else if (this.difficulty === "medium") {
                this.setDifficulty("hard")
            }
            else {
                this.setDifficulty("easy")
            }
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