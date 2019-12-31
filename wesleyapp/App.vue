<template>
    <ImageBackground
        v-if="loaded"
        :source="bgImageBack.source"
        :onError="() => invalidatePicture(bgImageBack.name)"
        :imageStyle="{resizeMode: 'stretch'}"
        class="full-flex">
        <animated:view
            :style="{opacity: backgroundOpacity}"
            class="full-flex">
            <ImageBackground
                :source="bgImageFront.source"
                :onError="() => invalidatePicture(bgImageFront.name)"
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
                        :tutorial="false"
                        :queuedCallback="queuedCallback" />
                </View>

                <Home
                    v-if="curActivity.name === 'home'"
                    :random-activity="randomActivity"
                />
                <Options
                    v-else-if="curActivity.name === 'options'"
                />
                <Personalize
                    v-else-if="curActivity.name === 'personalize'"
                    :change-background="changeBackground"
                />
                <FindWordInSentence
                    v-else-if="curActivity.name === 'findWordInSentence'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                    :sayLevelUp="sayLevelUp"
                />
                <FindWordByPicture
                    v-else-if="curActivity.name === 'findWordByPicture'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                    :sayLevelUp="sayLevelUp"
                />
                <FindWordByLetter
                    v-else-if="curActivity.name === 'findWordByLetter'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                    :sayLevelUp="sayLevelUp"
                />
                <SpellWord
                    v-else-if="curActivity.name === 'spellWord'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                    :sayLevelUp="sayLevelUp"
                />
                <SpeakWord
                    v-else-if="curActivity.name === 'speakWord'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                    :sayLevelUp="sayLevelUp"
                />
                <FindLetterByAlliteration
                    v-else-if="curActivity.name === 'findLetterByAlliteration'"
                    :random-activity="randomActivity"
                    :change-background="changeBackground"
                    :playRandomSound="playRandomSound"
                    :sayGJ="sayGJ"
                    :sayLevelUp="sayLevelUp"
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
import Personalize from './components/Personalize'
import Sound  from 'react-native-sound'
import Sentence from './components/Sentence'
import { Animated, Easing } from "react-native";
import store  from './components/store'
import { difficulty } from './components/store'
import Vue from 'vue-native-core'
import { mapGetters, mapMutations, mapActions } from 'vuex'
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
        SpeakWord,
        Personalize
    },

    data () {
        return {
            bgImageBackName: 'bgDefault',
            bgImageFrontName: 'bgDefault',
            showGJ: false,
            gjSentence: "",
            gjList: ["Good job", "You're cool", "Great work", "You rock", "Awesome", "Cool beans", "Nice job", "Wow wow", "Oh yeah"],
            levelUpList: ["Level Up! Woah!", "Level up! Way to go!", "Level up! Amazing!", "Level up! Look at you!"],
            gjCallback: null,
            backgroundOpacity: new Animated.Value(1),
            appState: "active",
            loaded: false,
            queuedCallback: null,
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
        
        let pictures = await AsyncStorage.getItem("WesleyApp-pictures")
        this.loadPictures(pictures)

        // setup listeners for app closing to save user data
        AppState.addEventListener('change', this.handleAppStateChange)
        
        // setup resizing to fit different screens
        let screenHeight = Dimensions.get('window').height
        this.setSizeFactor(screenHeight/960)
        
        this.loaded = true

        // ask for permissions
        await this.askForPermissions()
    },

    computed: {
        bgImageBack () {
            return this.getPicture(this.bgImageBackName)
        },

        bgImageFront () {
            return this.getPicture(this.bgImageFrontName)
        },

        ...mapGetters([
            'getUserData',
            'allowedTopics',
            'curActivity',
            'textToSpeech',
            'difficultyReading',
            'getPicture'
        ]),
    },

    methods: {
        ...mapMutations([
            'setSizeFactor',
            'setUserData',
            'setActivity',
        ]),

        ...mapActions([
            'loadPictures',
            'invalidatePicture'
        ]),

        randomActivity (changeBackground = true) {
            var activityList = []
            if (this.allowedTopics.includes('spelling')) {
                activityList.push({name: 'spellWord', topic: 'Spelling', changeChance: 0})
                activityList.push({name: 'findWordByLetter', topic: 'Spelling', changeChance: 0.15})
                activityList.push({name: 'findLetterByAlliteration', topic: 'Spelling', changeChance: 0.3})
            }
            if (this.allowedTopics.includes('reading')) {
                activityList.push({name: 'findWordByPicture', topic: 'Reading', changeChance: 0})
                activityList.push({name: 'findWordInSentence', topic: 'Reading', changeChance: 0})
                activityList.push({name: 'speakWord', topic: 'Reading', changeChance: 0})
            }
            let newActivity
            let random
            do {
                newActivity = activityList[Math.floor(Math.random() * activityList.length)]
                random = Math.random()
            }
            while (this.curActivity.name === newActivity.name || newActivity.changeChance > random || !this.canPlay(newActivity))
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
        changeBackground (newImageName, callback) {
            this.backgroundOpacity = new Animated.Value(0)
            this.bgImageFrontName = newImageName
            Animated.timing(this.backgroundOpacity, {
                toValue: 1,
                duration: 600,
            }).start(() => {
                this.bgImageBackName = newImageName
                if (callback) callback()
            })
        },

        defaultBackground (callback) {
            this.changeBackground('bgDefault', callback)
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
            // prepare the callback for after animation finishes
            this.queuedCallback = () => {
                this.$refs.gjSentence.beginNarration()
            }
            this.showGJ = true
        },

        finishGJ () {
            // prepare the callback for after animation finishes
            this.queuedCallback = () => {
                this.showGJ = false
                this.gjCallback()
            }
            Vue.nextTick(() => {this.$refs.gjSentence.animateOut()})
        },

        // we piggy back off of gj component for this, should refactor name
        sayLevelUp (callback) {
            this.gjCallback = callback
            var ran = Math.floor(Math.random() * this.levelUpList.length)
            this.gjSentence = this.levelUpList[ran]
            // prepare the callback for after animation finishes
            this.queuedCallback = () => {
                this.$refs.gjSentence.beginNarration()
            }
            this.showGJ = true
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
                        message: "To save progress and personalization",
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
                        message: 'One activity involves reading outloud!',
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