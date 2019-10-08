<template>
    <view class="container">
        <touchable-opacity
            :onPress="() => changeActivity('findWordInSentence')"
            class="blue-box"
            :style="shadow">
            <text class="normal-text">Start</text>
        </touchable-opacity>
        <touchable-opacity
            class="mt-6 white-box"
            :style="shadow"
            :onPress="() => changeActivity('options')">
            <text class="link-text">Options</text>
        </touchable-opacity>
    </view>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
    props: {
        changeActivity: {
            type: Function,
            required: true
        }
    },

    computed: {
        ...mapGetters([
            'shadow'
        ])
    },

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

    .link-text {
        color: 'rgb(0, 119, 179)';
        font-size: 20
    }

    .normal-text {
        color: white;
        font-size: 40;
    }
    
    .mt-6 {
        margin-top: 30
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
</style>