<!-- Most of this is copied from SpeakWord. Idealy this code wouldn't duplicate but thats low priority atm. ANY CHANGE TO SpeakWord NEEDS TO UPDATE THIS TOO -->
<template>
    <view
        class="container"
        :class="{'normal-shadow': showRecordIntro}">
        <touchable-opacity
            v-if="showRecordIntro"
            class="top-of-screen"
            :style="{padding: 25 * sizeFactor}"
            :onPress="undo">
            <text
                class="normal-text"
                :style="{fontSize: fontSize}"
                :allowFontScaling="false">
                Be careful! What you record here is what your child will hear in the app. If you ever make a bad recording, press "Undo"!
            </text>
        </touchable-opacity>
        <view
            class="word-to-speak"
            :style="{marginTop: 50 * sizeFactor}" >
            <Word
                v-if="showWord"
                ref="targetWordRef"
                :key="wordList[curWord]"
                :word="wordList[curWord]"
                :wordPressed="() => {}"
                :setManuallyReading="() => {}"
                :manuallyReading="true"
                :narrating="false"
                :continueSentence="()=>{}"
                :finishedAnimating="queuedCallback"
                :animationSpeedFactor="0.5"
                :skipShrink="!narrating" />
        </view>
        <animated:image
            v-if="showMic"
            :fadeDuration="0"
            :style="{height: maxGrowth, width: maxGrowth, resizeMode: 'stretch'}"
            :source="micPic" />
        
        <view
            v-if="bulkRecording"
            class="back-button"
            :style="{marginBottom: 50 * sizeFactor}" >
            <touchable-opacity
                :onPress="quit"
                :disabled="showRecordIntro"
                :class="{'white-box-shadow': showRecordIntro, 'white-box': !showRecordIntro}"
                :style="[{padding: paddingSizeSmall}, roundBox]">
                <text 
                    :style="{fontSize: fontSizeSmall}"
                    :class="{'link-text': !showRecordIntro, 'link-text-shadow': showRecordIntro}">
                    Stop Recording
                </text>
            </touchable-opacity>
            <touchable-opacity
                :class="{'white-box': curWord !== 0, 'white-disabled-box': curWord === 0}"
                :disabled="curWord === 0"
                :onPress="undo"
                :style="[{
                            padding: paddingSizeSmall,
                            paddingRight: paddingSizeSmall*2,
                            paddingLeft: paddingSizeSmall*2,
                            marginLeft: 40 * sizeFactor,
                            marginRight: 10 * sizeFactor
                        }, roundBox]">
                <text 
                    :style="{fontSize: fontSizeSmall}"
                    class="link-text">
                    Undo
                </text>
            </touchable-opacity>
        </view>
    </view>
</template>

<script>
import { Platform, Animated, Alert } from 'react-native'
import Word from './Word'
import { mapGetters, mapMutations, mapActions } from 'vuex'
import {AudioRecorder, AudioUtils} from 'react-native-audio'
import Sound  from 'react-native-sound'
import micNormal from '../assets/mic.png'
import micReady from '../assets/micReady.png'
import micRecording from '../assets/micRecording.png'
import { difficulty } from './store'
import Vue from 'vue-native-core'

export default {
    props: {
        wordList: {
            type: Array,
            required: true
        },
        allDone: {
            type: Function,
            required: true
        },
        bulkRecording: {
            type: Boolean,
            default: false,
        },
    },
    
    components: {
        Word,
    },

    data () {
        return {
            narrating: false,
            manuallyReading: false,
            showWord: false,
            userSpoke: false,
            hasAudio: false,
            currentMetering: 0,
            audioBegins: 0,
            showMic: true,
            silenceDuration: 999,
            maxGrowth: new Animated.Value(0),
            queuedCallback: null,
            curWord: -1,
            audioDetails: [],
            reviewed: true,
            recording: null,
            undoing: false,
            quiter: false,
            prompting: false
        }
    },

    mounted () {
        if (!this.showRecordIntro) this.getNext()
    },

    computed: {
        filePath () {
            let word = this.wordList[this.curWord].toLowerCase().replace("'", "")
            return AudioUtils.DocumentDirectoryPath + '/' + word + '.aac'
        },

        micPic () {
            if (this.narrating) {
                return micNormal
            }
            else if (this.silenceDuration <= 3) {
                return micRecording
            }
            else {
                return micReady
            }
        },
        
        ...mapGetters([
            'sizeFactor',
            'roundBox',
            'paddingSizeSmall',
            'fontSizeSmall',
            'fontSize',
            'showRecordIntro',
            'textToSpeech',
        ]),
    },

    methods: {
        ...mapActions([
            'afterSpeak',
        ]),

        ...mapMutations([
            'finishRecordIntro'
        ]),

        // Move on to the next word. This does the following in order:
        // Animates out the current word if shown
        // Displays the new target word
        // Prompts the user to begin speaking if they havent said any words yet
        async getNext () {
            this.queuedCallback = null
            if (this.curWord === this.wordList.length - 1 && !this.undoing) {
                this.allDone(this.audioDetails)
            }
            // still have words left to record
            else {
                // disable interaction
                this.manuallyReading = true
                this.narrating = true
                // reset finished state
                this.userSpoke = false
                this.reviewed = false
                // hide these while we switch curWord
                this.showWord = false
                // move on to the previous word if we're undoing
                if (this.undoing) {
                    this.curWord--
                    this.undoing = false
                    // we also want to remove the last 2 audio details from our list, since we're technically undoing both the one they clicked "undo" on and the previous word
                    this.audioDetails.pop()
                    this.audioDetails.pop()
                }
                // move on to next word
                else {
                    this.curWord++
                }
                this.animateWord()
            }
        },

        animateWord () {
            // prepare the callback for after animation finishes
            this.queuedCallback = this.finishedTargetWord
            //initiate animation
            this.showWord = true
            // we only have to animate the mic in for the first word since it never animates out
            if (this.curWord === 0) {
                this.animateGrowth(true)
            }
        },

        finishedTargetWord () {
            if (this.narrating) {
                // we're reinforcing the user's reading, 
                if (this.userSpoke) {
                    // we already played their recording back to them, now finish
                    if (this.reviewed) {
                        this.doneReviewing()
                    }
                    // load the recording
                    else {
                        this.recording = new Sound(this.filePath, '', (error) => {
                            if (error) {
                                console.log('failed to load the sound', error)
                                this.reviewed = true
                                this.recording.release()
                                if (this.undoing) {
                                    this.audioDetails.push({})
                                    this.finishedTargetWord()
                                }
                                else {
                                    this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                                }
                                return
                            }

                            
                            this.audioDetails.push({
                                word: this.wordList[this.curWord].toLowerCase().replace("'", ""),
                                startTime: this.audioBegins, 
                                recordingLength: this.recording.getDuration() - Math.max(this.audioBegins - 0.3, 0)
                            })
                            // Set the recording to start at 0.3 second before we heard the user start speaking
                            this.recording.setCurrentTime(Math.max(this.audioBegins - 0.3, 0))
                            // After it plays, read the word a final time
                            let callback = (success) => {
                                this.reviewed = true
                                this.recording.release()
                                this.finishedTargetWord()
                            }
                            // play the recording
                            this.recording.play(callback)
                        })
                    }
                }
                // we're initially reading the word, prompt them to speak it now
                else {
                    this.promptSpeaking()
                }
            }
            // else would be for when the user clicks the target word at top of screen, which we dont do anything for
        },

        promptSpeaking () {
            // check if android needs checkAuthorizationStatus or this looped
            AudioRecorder.requestAuthorization().then((isAuthorized) => {
                if (!isAuthorized) return this.requestPermission()

                AudioRecorder.prepareRecordingAtPath(this.filePath, { MeteringEnabled: true, AudioEncoding: "aac" })
                this.currentMetering = 0
                this.hasAudio = false
                this.audioBegins = 0
                this.silenceDuration = 999
                // this is just for logging incase i need to debug
                AudioRecorder.onFinished = (data) => {
                    if (!data) return
                }
                // keep track of metering
                AudioRecorder.onProgress = (data) => {
                    // They manually chose to stop recording
                    if (this.undoing || this.quiter) {
                        this.stopRecording()
                        this.hasAudio = true
                        return
                    }
                    this.currentMetering = data.currentMetering
                    let levelRequired = Platform.OS === 'android' ? 8000 : -15
                    // They're speaking
                    if (this.currentMetering > levelRequired) {
                        this.hasAudio = true
                        this.silenceDuration = 0
                        if (this.audioBegins === 0) {
                            this.audioBegins = data.currentTime
                        }
                    }
                    // They've stopped speaking (or havent started yet)
                    else {
                        this.silenceDuration++
                        if (this.silenceDuration > 1 && this.hasAudio) {
                            this.stopRecording()
                            return
                        }
                    }
                    // auto stop after 2 seconds of recording
                    if (this.hasAudio && data.currentTime - this.audioBegins > 2) {
                        this.stopRecording()
                        return
                    }
                }
                
                let callback = async () => {
                    if (this.quiter) this.allDone(this.audioDetails)
                    this.prompting = false
                    this.narrating = false
                    this.$refs.targetWordRef.startHighlightRepeating()
                    this.manuallyReading = false
                    try { await AudioRecorder.startRecording() }
                    // more logs for later debugging
                    catch (error) { console.log ("recording error"); console.log(error) }
                }
                // we only prompt the user for the first word
                if (this.curWord === 0) {
                    this.prompting = true
                    this.afterSpeak({
                        word: "Please read the word loud and clear",
                        callback
                    })
                }
                else {
                    callback()
                }
                
            })
        },

        async requestPermission () {
            Alert.alert(
                'Audio permission required to record',
                'Please go into settings and enable it for this app',
                [
                    {text: 'OK', onPress: this.quit}
                ],
                {cancelable: false}
            )
        },

        async stopRecording () {
            try {
                await AudioRecorder.stopRecording()
            }
            catch (error) {console.log(error)}
            if (this.quiter) return
            this.finishRecording()
        },

        // The recording time is done, stop recording and either re-prompt the user or move on to the next word
        finishRecording () {
            this.$refs.targetWordRef.stopHighlightRepeating()
            if (this.hasAudio) {
                // set this to prevent the user from pressing buttons during transition
                this.narrating = true
                this.manuallyReading = true

                // indicate we're in a finished state
                this.userSpoke = true
                this.finishedTargetWord()
            }
            else {
                this.narrating = true
                this.manuallyReading = true
                this.promptSpeaking()
            }
        },

        doneReviewing () {
            // prepare the callback for after animation finishes
            this.queuedCallback = () => {
                this.showWord = false
                // next word/sentence
                this.getNext()
            }
            // next tick so everything picks up the queuedCallback
            Vue.nextTick(() => {
                // animate out our word if it exists
                this.$refs.targetWordRef.animateOut()
                // we're done with all the recordings, get rid of the mic too
                if (this.curWord === this.wordList.length - 1) {
                    this.animateGrowth(false)
                }
            })
        },

        setManuallyReading (val) {
            if (!this.narrating) {
                this.manuallyReading = val
            }
        },
        
        // true = grow it
        // false = shrink it
        animateGrowth (grow, callback = () => {}) {
            let max = 0
            if (grow) {
                max =  250 * this.sizeFactor
            }
            // Animate the word in, going from 0 size to full
            Animated.parallel([
                Animated.timing(this.maxGrowth, {
                    toValue: max,
                    duration: 250,
                    useNativeDriver: false,
                }),
            ]).start(callback)
        },

        async quit () {
            if (this.quiter || this.undoing) return
            try {
                this.quiter = true
                AudioRecorder.stopRecording()
                this.$refs.targetWordRef.stopHighlightRepeating()
                if (this.recording) this.recording.release()
                console.log('got here')
                this.textToSpeech.stop()
            }
            catch (error) { console.log(error) }
            // we dont quit while reading the prompt because it causes a rare bug, so we wait for the prompt to finish then quit
            if (!this.prompting) this.allDone(this.audioDetails)
        },

        async undo () {
            if (this.quiter || this.undoing) return
            if (this.showRecordIntro) {
                this.finishRecordIntro()
                this.getNext()
            }
            if (this.curWord != 0) {
                this.undoing = true
            }
        },
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

    .word-to-speak {
        position: absolute;
        top: 0;
        align-self: center;
    }

    .back-button {
        position: absolute;
        bottom: 0;
        align-self: center;
        flex-direction: row

    }

    .white-box {
        background-color: 'rgb(255, 255, 255)';
    }

    .white-disabled-box {
        background-color: 'rgba(255, 255, 255, 0.5)';
    }

    .link-text {
        color: 'rgb(0, 119, 179)';
    }

    .normal-shadow {
        background-color: 'rgba(0, 0, 0, 0.7)' !important;
    }

    .link-text-shadow {
        color: 'rgb(0, 36, 54)';
    }

    .white-box-shadow {
        background-color: 'rgb(76, 76, 76)';
    }

    .normal-text {
        color: white;
    }

    .top-of-screen {
        position: absolute;
        top: 0;
    }

</style>