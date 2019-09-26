<template>
      <ImageBackground :source="bgImage"
        class="full-flex">

        <View
            v-if="showGJ"
            class="container">
            <Sentence
                ref="gjSentence"
                :finish-narration="finishGJ"
                :sentence="gjSentence"
                :highlight-speed="highlightSpeed"
                :text-to-speech="textToSpeech"
                :word-pressed="() => {}"
                :narrating="true"
                :setManuallyReading="() => {}"
                :manuallyReading="true"
                :tutorial="false" />
        </View>

        <Home
            v-if="curActivity === 'home'"
            :shadow="shadow"
            :change-activity="changeActivity"
        />
        <Options
            v-else-if="curActivity === 'options'"
            :shadow="shadow"
            :change-activity="changeActivity"
        />
        <FindWordInSentence
            v-else-if="curActivity === 'findWordInSentence'"
            :text-to-speech="textToSpeech"
            :shadow="shadow"
            :highlight-speed="highlightSpeed"
            :random-activity="randomActivity"
            :change-background="changeBackground"
            :playRandomSound="playRandomSound"
            :sayGJ="sayGJ"
        />
        <FindWordByPicture
            v-else-if="curActivity === 'findWordByPicture'"
            :text-to-speech="textToSpeech"
            :shadow="shadow"
            :highlight-speed="highlightSpeed"
            :random-activity="randomActivity"
            :change-background="changeBackground"
            :playRandomSound="playRandomSound"
            :sayGJ="sayGJ"
        />
        
    </ImageBackground>
</template>

<script>
import tts from 'react-native-tts';
import { Platform } from 'react-native';
import FindWordInSentence from './components/FindWordInSentence';
import FindWordByPicture from './components/FindWordByPicture';
import Home from './components/Home';
import Options from './components/Options';
import bgDefault from './assets/home.jpg';
import Sound  from 'react-native-sound'
import Sentence from './components/Sentence'


export default {
    components: {
        Options,
        Home,
        FindWordInSentence,
        FindWordByPicture,
        Sentence
    },

    data () {
        return {
            curActivity: 'home',
            textToSpeech: tts,
            shadow: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.8,
                shadowRadius: 5,
            },
            highlightSpeed: 56,
            bgImage: bgDefault,
            soundList: [
                'success_one.wav',
                'success_two.wav',
                'success_four.wav',
                'success_five.wav',
                'success_six.wav',
                'success_seven.wav',
                'success_eight.wav',
                'success_nine.wav',
                'success_ten.wav',
                'success_twelve.wav',
                'success_thirteen.wav',
                'success_fifteen.wav',
                'success_sixteen.wav'
            ],
            showGJ: false,
            gjSentence: "",
            gjList: ["Good job", "You're cool", "Great work", "You rock", "Awesome", "Cool beans", "Nice job"],
            gjCallback: null,

        }
    },

    mounted () {
        this.textToSpeech.voices().then(voices => {
            // hear all the voices
            /*
            for (index in voices) {
                this.textToSpeech.setDefaultVoice(voices[index].id);
                this.textToSpeech.speak("The dog is friendly");
            }*/
            // Setup voice
            if (Platform.OS === 'android') {
                this.textToSpeech.setDefaultVoice(voices[15].id);
                this.textToSpeech.setDefaultRate(0.3);
            }
            else if (Platform.OS === 'ios') {
                // TODO
            }
        });
        
        // TODO load saved user data
        // TODO setup listeners for app closing to save user data
    },

    methods: {
        changeActivity (actName, changeObject) {
            this.curActivity = actName
        },

        // TODO
        randomActivity () {
            this.defaultBackground()
            this.curActivity = "findWordByPicture"
        },

        changeBackground (newImage) {
            this.bgImage = newImage
        },

        defaultBackground () {
            this.bgImage = bgDefault
        },

        playRandomSound(callback) {
            var ran = Math.floor(Math.random() * this.soundList.length)
            var sound = new Sound(this.soundList[ran], Sound.MAIN_BUNDLE, (error) => {
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
        }
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