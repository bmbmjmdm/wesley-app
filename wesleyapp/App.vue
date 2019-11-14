<template>
    <ImageBackground
        :source="bgImageBack"
        :imageStyle="{resizeMode: 'stretch'}"
        class="full-flex">
        <animated:view
            :style="{opacity: backgroundOpacity}"
            class="full-flex">
            <ImageBackground
                :source="bgImageFront"
                :imageStyle="{resizeMode: 'stretch'}"
                class="full-flex">

                <View
                    v-if="showGJ"
                    class="container">
                    <Sentence
                        ref="gjSentence"
                        :finish-narration="finishGJ"
                        :sentence="gjSentence"
                        :word-pressed="() => {}"
                        :narrating="true"
                        :setManuallyReading="() => {}"
                        :manuallyReading="true"
                        :tutorial="false" />
                </View>

                <Home
                    v-if="curActivity.name === 'home'"
                    :random-activity="randomActivity"
                />
                <Options
                    v-else-if="curActivity.name === 'options'"
                />
                <FindWordInSentence
                    v-else-if="curActivity.name === 'findWordInSentence'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                />
                <FindWordByPicture
                    v-else-if="curActivity.name === 'findWordByPicture'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                />
                <FindWordByLetter
                    v-else-if="curActivity.name === 'findWordByLetter'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                />
                <SpellWord
                    v-else-if="curActivity.name === 'spellWord'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                />
                
            </ImageBackground>
        </view>
    </ImageBackground>
</template>

<script>
import { Platform, AppState, AsyncStorage, Dimensions } from 'react-native';
import FindWordInSentence from './components/FindWordInSentence';
import FindWordByPicture from './components/FindWordByPicture';
import FindWordByLetter from './components/FindWordByLetter'
import SpellWord from './components/SpellWord';
import Home from './components/Home';
import Options from './components/Options';
import bgDefault from './assets/home.jpg';
import Sound  from 'react-native-sound'
import Sentence from './components/Sentence'
import { Animated, Easing } from "react-native";
import store  from './components/store'
import Vue from 'vue-native-core'
import { mapGetters, mapMutations } from 'vuex'
Vue.prototype.$store = store

export default {
    components: {
        Options,
        Home,
        FindWordInSentence,
        FindWordByPicture,
        SpellWord,
        FindWordByLetter,
        Sentence
    },

    data () {
        return {
            bgImageBack: bgDefault,
            bgImageFront: bgDefault,
            showGJ: false,
            gjSentence: "",
            gjList: ["Good job", "You're cool", "Great work", "You rock", "Awesome", "Cool beans", "Nice job"],
            gjCallback: null,
            backgroundOpacity: new Animated.Value(1),
            appState: "active",
        }
    },

    async mounted () {
        this.textToSpeech.getInitStatus().then(() => this.textToSpeech.speak(''))

        // load saved user data
        let data = await AsyncStorage.getItem("WesleyApp-childProgress")
        if (data) {
            data = JSON.parse(data)
            this.setUserData(data)
        }

        // setup listeners for app closing to save user data
        AppState.addEventListener('change', this.handleAppStateChange)
        
        // setup resizing to fit different screens
        let screenHeight = Dimensions.get('window').height
        this.setSizeFactor(screenHeight/960)
    },

    computed: {
        ...mapGetters([
            'getUserData',
            'allowedTopics',
            'curActivity',
            'textToSpeech'
        ]),
    },

    methods: {
        ...mapMutations([
            'setSizeFactor',
            'setUserData',
            'setActivity'
        ]),

        randomActivity (changeBackground = true) {
            var activityList = []
            if (this.allowedTopics.includes('spelling')) {
                activityList.push({name: 'spellWord', topic: 'Spelling'})
                // currently we're not using findWordByLetter
                //activityList.push('findWordByLetter')
            }
            if (this.allowedTopics.includes('reading')) {
                activityList.push({name: 'findWordByPicture', topic: 'Reading'})
                activityList.push({name: 'findWordInSentence', topic: 'Reading'})
            }

            let newActivity = activityList[Math.floor(Math.random() * activityList.length)]
            this.setActivity({name: '', topic: ''})

            if (!this.needsDefaultBackground(newActivity)) {
                changeBackground = false
            }
            if (changeBackground) {
                this.defaultBackground(() => {
                    this.setActivity(newActivity)
                })
            }
            else {
                Vue.nextTick(() => {
                    this.setActivity(newActivity)
                })
            }
        },

        // fades in the new background
        changeBackground (newImage, callback) {
            this.backgroundOpacity = new Animated.Value(0)
            this.bgImageFront = newImage
            Animated.timing(this.backgroundOpacity, {
                toValue: 1,
                duration: 600,
            }).start(() => {
                this.bgImageBack = newImage
                callback()
            })
        },

        defaultBackground (callback) {
            this.changeBackground(bgDefault, callback)
        },

        needsDefaultBackground (activity) {
            switch(activity.name) {
            case 'findWordInSentence':
                return false
            case 'findWordByPicture':
                return true
            case 'spellWord':
                return false
            case 'findWordByLetter':
                return true
            default:
                return true
            } 
        },

        playRandomSound(callback) {
            var ran = Math.floor(Math.random() * 29)
            console.log("loading success_"+ran)
            var sound = new Sound("success_" + ran + ".wav", Sound.MAIN_BUNDLE, (error) => {
                if (error) {
                    console.log('failed to load sound #' + ran, error)
                    return
                } 
                sound.play(callback)
            })
        },

        sayGJ (callback) {
            this.gjCallback = callback
            var ran = Math.floor(Math.random() * this.gjList.length)
            this.gjSentence = this.gjList[ran]
            this.showGJ = true
            // timeout is to allow sentence to animate in
            setTimeout(() => {
                this.$refs.gjSentence.beginNarration()
            }, 700)
        },

        finishGJ () {
            this.$refs.gjSentence.animateOut()
            setTimeout(() => {
                this.showGJ = false
                this.gjCallback()
            }, 525)
        },

        
        //save child progress data when app is put into background/closed 
        handleAppStateChange (nextAppState) {
            if (this.appState === 'active' && nextAppState.match(/inactive|background/) ) {
                let stringFile = JSON.stringify(this.getUserData)
                AsyncStorage.setItem("WesleyApp-childProgress", stringFile);
            }
            this.appState = nextAppState
        },
    }

}
</script>


<style>
    .full-flex {
        flex-grow: 1;
        flex-shrink: 1;
        flex: 1;
    }

    .container {
        align-items: center;
        justify-content: center;
        flex-grow: 1;
        flex-shrink: 1;
        flex: 1;
        flex-direction: row;
    }
</style>