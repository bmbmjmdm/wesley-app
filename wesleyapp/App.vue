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
                <SpeakWord
                    v-else-if="curActivity.name === 'speakWord'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                />
                <FindLetterByAlliteration
                    v-else-if="curActivity.name === 'findLetterByAlliteration'"
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
import { Platform, AppState, AsyncStorage, Dimensions, PermissionsAndroid } from 'react-native';
import FindWordInSentence from './components/FindWordInSentence';
import FindWordByPicture from './components/FindWordByPicture';
import FindWordByLetter from './components/FindWordByLetter'
import FindLetterByAlliteration from './components/FindLetterByAlliteration'
import SpellWord from './components/SpellWord';
import SpeakWord from './components/SpeakWord';
import Home from './components/Home';
import Options from './components/Options';
import bgDefault from './assets/home.jpg';
import Sound  from 'react-native-sound'
import Sentence from './components/Sentence'
import { Animated, Easing } from "react-native";
import store  from './components/store'
import { difficulty } from './components/store'
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
        FindLetterByAlliteration,
        Sentence,
        SpeakWord
    },

    data () {
        return {
            bgImageBack: bgDefault,
            bgImageFront: bgDefault,
            showGJ: false,
            gjSentence: "",
            gjList: ["Good job", "You're cool", "Great work", "You rock", "Awesome", "Cool beans", "Nice job", "Wow wow", "Oh yeah"],
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
        
        // ask for permissions
        await this.askForPermissions()
    },

    computed: {
        ...mapGetters([
            'getUserData',
            'allowedTopics',
            'curActivity',
            'textToSpeech',
            'difficultyReading'
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
                activityList.push({name: 'spellWord', topic: 'Spelling', changeChance: 0})
                activityList.push({name: 'findWordByLetter', topic: 'Spelling', changeChance: 0.33})
                activityList.push({name: 'findLetterByAlliteration', topic: 'Spelling', changeChance: 0.33})
            }
            if (this.allowedTopics.includes('reading')) {
                activityList.push({name: 'findWordByPicture', topic: 'Reading', changeChance: 0})
                activityList.push({name: 'findWordInSentence', topic: 'Reading', changeChance: 0})
                activityList.push({name: 'speakWord', topic: 'Reading', changeChance: 0})
            }

            let newActivity = activityList[Math.floor(Math.random() * activityList.length)]
            let random = Math.random()
            while (this.curActivity.name === newActivity.name || newActivity.changeChance > random) {
              newActivity = activityList[Math.floor(Math.random() * activityList.length)]
              random = Math.random()
            }
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
            case 'findLetterByAlliteration':
                return true
            case 'speakWord':
                return false
            default:
                return true
            } 
        },

        canPlay (activity) {
            switch(activity.name) {
            case 'speakWord':
                return this.difficultyReading > difficulty.EASY
            default:
                return true
            } 
        },

        playRandomSound(callback) {
            var ran = Math.floor(Math.random() * 29)
            console.log("loading success_"+ran)
            var sound = new Sound("success_" + ran + ".wav", Sound.MAIN_BUNDLE, (error) => {
                let realCallback = () => {
                  sound.release()
                  callback()
                }
                if (error) {
                    console.log('failed to load sound #' + ran, error)
                    realCallback()
                } 
                sound.play(realCallback)
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

        // only called once at start of app
        async askForPermissions () {
            if (Platform.OS === 'android') {
                try {
                    const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                        {
                        title: 'Permissions for write access',
                        message: 'Give permission to write files',
                        buttonPositive: 'ok',
                        },
                    )
                    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                        console.log('You can use the storage')
                    } else {
                        console.log('permission denied')
                    }
                } catch (err) {
                    console.warn(err)
                }
            }
            if (Platform.OS === 'android') {
                try {
                    const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                        {
                        title: 'Permissions for mic access',
                        message: 'Give permission to use mic',
                        buttonPositive: 'ok',
                        },
                    )
                    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                        console.log('You can use the mic')
                    } else {
                        console.log('permission denied')
                    }
                } catch (err) {
                    console.warn(err)
                }
            }
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