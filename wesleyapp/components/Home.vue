<template>
    <view
        class="container"
        :class="{'normal-shadow': showIntro}">
        <touchable-opacity
            v-if="showIntro"
            class="top-of-screen"
            :onPress="nextIntro">
            <text
                class="normal-text"
                :style="{fontSize: fontSize}">
                {{ introText }}
            </text>
        </touchable-opacity>
        <touchable-opacity
            :onPress="startGame"
            :class="{'blue-box': !showIntro || introStep == 0, 'blue-shadow': showIntro && introStep != 0}"
            :style="[{paddingTop: paddingSize,
                    paddingBottom: paddingSize,
                    paddingRight: paddingSize * 1.5,
                    paddingLeft: paddingSize * 1.5,
                    marginTop: showIntro ? paddingSize * 2 : 0},
                    roundBox]">
            <text 
                :style="{fontSize: fontSize}"
                :class="{'normal-text': !showIntro || introStep == 0, 'normal-text-shadow': showIntro && introStep != 0}">
                Start
            </text>
        </touchable-opacity>
        <touchable-opacity
            :class="{'white-box': !showIntro || introStep == 1, 'white-shadow': showIntro && introStep != 1, 'mt-6': true}"
            :style="[{padding: paddingSizeSmall}, roundBox]"
            :onPress="viewOptions">
            <text 
                :style="{fontSize: fontSizeSmall}"
                :class="{'link-text': !showIntro || introStep == 1, 'link-text-shadow': showIntro && introStep != 1}">
                Options
            </text>
        </touchable-opacity>
        <touchable-opacity
            :class="{'white-box': !showIntro || introStep == 2, 'white-shadow': showIntro && introStep != 2, 'mt-6': true}"
            :style="[{padding: paddingSizeSmall}, roundBox]"
            :onPress="viewPersonalize">
            <ActivityIndicator
                v-if="loading"
                size="large"
                class="overlay"
            />
            <text 
                :style="{fontSize: fontSizeSmall}"
                :class="{'link-text': !showIntro || introStep == 2, 'link-text-shadow': showIntro && introStep != 2}">
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
        loading: false,
        introStep: -1,
      }
    },

    computed: {
        introText () {
            switch(this.introStep) {
                case 0:
                    return "Press here to start reading/spelling. Once you do, you can't go back to the main menu, preventing children from toying with options"
                    break;
                case 1:
                    return "Press here for options. This includes changing the difficulty (we suggest doing this before you start) as well as enabling/disabling topics"
                    break;
                case 2:
                    return "Press here to link your own photos to words in the app! Personalize the app so your kid sees YOUR picture for \"mom\", \"dad\", \"dog\", etc!"
                    break;
            } 
        },

        ...mapGetters([
            'roundBox',
            'paddingSize',
            'paddingSizeSmall',
            'fontSizeSmall',
            'fontSize',
            'showIntro',
        ])
    },

    created () {
        if (this.showIntro) {
            this.introStep = 0
        }
    },

    methods: {
        nextIntro () {
            this.introStep++
            if (this.introStep > 2) {
                this.finishIntro()
            }
        },

        startGame () {
            if (this.showIntro) {
                if (this.introStep === 0) {
                    this.nextIntro()
                }
            }
            else {
                this.randomActivity(false)
            }
        },

        viewOptions () {
            if (this.showIntro) {
                if (this.introStep === 1) {
                    this.nextIntro()
                }
            }
            else {
                this.setActivity({name: 'options'})
            }
        },

        // dont know why nextTick isn't enough, but we need the setTimeout to make the loading indicator appear
        viewPersonalize () {
            if (this.showIntro) {
                if (this.introStep === 2) {
                    this.nextIntro()
                }
            }
            else {
                this.loading = true
                setTimeout(() => {
                    Vue.nextTick(() => {
                        this.setActivity({name: 'personalize'})
                    })
                }, 10)
            }
        },

        ...mapMutations([
            'setActivity',
            'finishIntro'
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

    .top-of-screen {
        position: absolute;
        top: 0;
        padding: 25;
    }

    .normal-shadow {
        background-color: 'rgba(0, 0, 0, 0.7)' !important;
    }

    .blue-shadow {
        background-color: 'rgb(0, 36, 54)' !important;
    }

    .white-shadow {
        background-color: 'rgb(76, 76, 76)';
    }

    .blue-box {
        background-color: 'rgb(0, 119, 179)';
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