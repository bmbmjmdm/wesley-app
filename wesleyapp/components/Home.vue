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
        <touchable-opacity
            class="mt-4 white-box"
            :style="[{padding: paddingSizeSmall}, roundBox]"
            :onPress="viewPersonalize">
            <ActivityIndicator
                v-if="loading"
                size="large"
                class="overlay"
            />
            <text 
                :style="{fontSize: fontSizeSmall}"
                class="link-text">
                Personalize
            </text>
        </touchable-opacity>
    </view>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import Vue from 'vue-native-core'
import { ActivityIndicator } from 'react-native'

export default {
    components: {
        ActivityIndicator
    },
    props: {
        randomActivity: {
            type: Function,
            required: true
        }
    },

    data () {
      return {
        loading: false
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
        // dont know why nextTick isn't enough, but we need the setTimeout to make the loading indicator appear
        viewPersonalize () {
            this.loading = true
            setTimeout(() => {
                Vue.nextTick(() => {
                    this.setActivity({name: 'personalize'})
                })
            }, 10)
        },

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
    
    .mt-4 {
        margin-top: 20
    }

    .white-box {
        background-color: 'rgb(255, 255, 255)';
    }

    .overlay {
        position: absolute
    }
</style>