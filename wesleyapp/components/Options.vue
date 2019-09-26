<template>
    <view class="container">
        <touchable-opacity
            :onPress="() => changeActivity('home')"
            class="blue-box"
            :style="shadow">
            <text class="normal-text">Back</text>
        </touchable-opacity>
        <touchable-opacity class="white-box mt-6" :onPress="() => cycleDifficulty()">
            <text class="link-text">{{ difficultyText }}</text>
        </touchable-opacity>
        <touchable-opacity class="white-box mt-6" :onPress="() => cycleAllowAutoAdjust()">
            <text class="link-text">{{ allowAutoAdjustText }}</text>
        </touchable-opacity>
    </view>
</template>

<script>
import {setDifficulty, setAllowAutoAdjust} from './userData'
import userData from './userData'

export default {
    props: {
        shadow: {
            type: Object,
            required: true
        },
        changeActivity: {
            type: Function,
            required: true
        },
    },

    computed: {
        difficultyText () {
            if (userData.difficulty === "easy") return "Easy difficulty"
            else if (userData.difficulty === "medium") return "Medium difficulty"
            else if (userData.difficulty === "hard") return "Hard difficulty"
        },
        allowAutoAdjustText () {
            if (userData.allowAutoAdjust) return "Auto Difficulty Adjustment ON"
            else return "Auto Difficulty Adjustment OFF"
        }
    },

    methods: {
        cycleDifficulty () {
            if (userData.difficulty === "easy") {
                setDifficulty("medium")
            }
            else if (userData.difficulty === "medium") {
                setDifficulty("hard")
            }
            else {
                setDifficulty("easy")
            }
        },
        cycleAllowAutoAdjust () {
            setAllowAutoAdjust(!userData.allowAutoAdjust)
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