<template>
    <view
        class="container"
        :class="{'normal-shadow': showIntro}">
        <touchable-opacity
            v-if="showIntro"
            class="top-of-screen"
            :style="{padding: 25 * sizeFactor}"
            :onPress="nextIntro">
            <text
                class="normal-text"
                :style="{fontSize: fontSize * 0.75}"
                :allowFontScaling="false">
                {{ introText }}
            </text>
        </touchable-opacity>
        <touchable-opacity
            :onPress="startGame"
            :class="{'blue-box': !showIntro || introStep == 1, 'blue-shadow': showIntro && introStep != 1}"
            :style="[{paddingTop: paddingSize,
                    paddingBottom: paddingSize,
                    paddingRight: paddingSize * 1.5,
                    paddingLeft: paddingSize * 1.5,
                    marginTop: showIntro ? paddingSize * 2 : 0},
                    roundBox]">
            <text 
                :style="{fontSize: fontSize}"
                :class="{'normal-text': !showIntro || introStep == 1, 'normal-text-shadow': showIntro && introStep != 1}">
                Start
            </text>
        </touchable-opacity>
        <touchable-opacity
            :class="{'white-box': !showIntro || introStep == 2, 'white-shadow': showIntro && introStep != 2}"
            :style="[{padding: paddingSizeSmall, marginTop: 30 * sizeFactor}, roundBox]"
            :onPress="viewOptions">
            <text 
                :style="{fontSize: fontSizeSmall}"
                :class="{'link-text': !showIntro || introStep == 2, 'link-text-shadow': showIntro && introStep != 2}">
                Lesson Options
            </text>
        </touchable-opacity>
        <touchable-opacity
            :class="{'white-box': !showIntro || introStep == 3, 'white-shadow': showIntro && introStep != 3}"
            :style="[{padding: paddingSizeSmall, marginTop: 30 * sizeFactor}, roundBox]"
            :onPress="viewPersonalize">
            <ActivityIndicator
                v-if="loading"
                size="large"
                class="overlay"
            />
            <text 
                :style="{fontSize: fontSizeSmall}"
                :class="{'link-text': !showIntro || introStep == 3, 'link-text-shadow': showIntro && introStep != 3}">
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
                    return "Welcome! I'm going to tell you what these buttons do. Press this text to continue."
                    break;
                case 1:
                    return "This button will start reading/spelling. Once you start, you can't go back to the main menu, preventing children from toying with options"
                    break;
                case 2:
                    return "This button provides game options. This includes changing the difficulty (we suggest doing this before you start) as well as enabling/disabling topics"
                    break;
                case 3:
                    return "This button lets you add your own photos and voice to the app! Then your child will see YOUR picture and hear YOUR voice for \"mom\", \"dad\", \"dog\", etc!"
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
            'sizeFactor',
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
            if (this.introStep > 3) {
                this.finishIntro()
            }
        },

        startGame () {
            if (this.showIntro) {
                if (this.introStep === 1) {
                    this.nextIntro()
                }
            }
            else {
                this.randomActivity(false)
            }
        },

        viewOptions () {
            if (this.showIntro) {
                if (this.introStep === 2) {
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
                if (this.introStep === 3) {
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

    .white-box {
        background-color: 'rgb(255, 255, 255)';
    }

    .overlay {
        position: absolute
    }
</style>