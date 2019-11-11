<template>
    <view class="container">
        <touchable-opacity
            :onPress="() => randomActivity(false)"
            class="blue-box"
            :style="[{paddingTop: paddingSize,
                    paddingBottom: paddingSize,
                    paddingRight: paddingSize * 1.5,
                    paddingLeft: paddingSize * 1.5 },
                    roundBox]">
            <text 
                :style="{fontSize: fontSize}"
                class="normal-text">
                Start
            </text>
        </touchable-opacity>
        <touchable-opacity
            class="mt-6 white-box"
            :style="[{padding: paddingSizeSmall}, roundBox]"
            :onPress="() => setActivity({name: 'options'})">
            <text 
                :style="{fontSize: fontSizeSmall}"
                class="link-text">
                Options
            </text>
        </touchable-opacity>
    </view>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
    props: {
        randomActivity: {
            type: Function,
            required: true
        }
    },

    computed: {
        ...mapGetters([
            'roundBox',
            'paddingSize',
            'paddingSizeSmall',
            'fontSizeSmall',
            'fontSize',
        ])
    },
    methods: {
        ...mapMutations([
            'setActivity'
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

    .white-box {
        background-color: 'rgb(255, 255, 255)';
    }
</style>