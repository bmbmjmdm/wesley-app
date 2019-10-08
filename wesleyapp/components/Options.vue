<template>
    <view class="container">
        <touchable-opacity
            :onPress="() => changeActivity('home')"
            class="blue-box"
            :style="shadow">
            <text class="normal-text">Back</text>
        </touchable-opacity>
        <touchable-opacity
            class="white-box mt-6"
            :onPress="() => cycleDifficulty()"
            :style="shadow">
            <text class="link-text">{{ difficultyText }}</text>
        </touchable-opacity>
        <touchable-opacity
            class="white-box mt-6"
            :onPress="() => cycleAllowAutoAdjust()"
            :style="shadow">
            <text class="link-text">{{ allowAutoAdjustText }}</text>
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
        
        ...mapGetters([
            'shadow',
            'difficulty',
            'allowAutoAdjust'
        ]),
    },

    methods: {
        ...mapMutations([
            'setDifficulty',
            'setAllowAutoAdjust'
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
        }
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
        padding-top: 15;
        padding-bottom: 15;
        padding-right: 30;
        padding-left: 30;
        border-radius: 20;
        elevation: 5;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    .white-box {
        background-color: 'rgb(255, 255, 255)';
        padding-top: 15;
        padding-bottom: 15;
        padding-right: 30;
        padding-left: 30;
        border-radius: 20;
        elevation: 5;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    .link-text {
        color: 'rgb(0, 119, 179)';
        font-size: 20
    }

    .normal-text {
        color: white;
        font-size: 20;
    }

    .mt-6 {
        margin-top: 30
    }
</style>