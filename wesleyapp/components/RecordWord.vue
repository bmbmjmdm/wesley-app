<!-- This is copied from SpeakWord. Idealy this code wouldn't duplicate but thats low priority atm. ANY CHANGE TO SpeakWord NEEDS TO UPDATE THIS TOO -->
<template>
    <view class="container">
        <view class="word-to-speak">
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
                :skipShrink="!narrating" />
        </view>
        <animated:image
            v-if="showMic"
            :fadeDuration="0"
            :style="{height: maxGrowth, width: maxGrowth, resizeMode: 'stretch'}"
            :source="micPic">
    </view>
</template>

<script>
import { Platform, Animated } from 'react-native'
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
        }
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
            reviewed: true
        }
    },

    mounted () {
        this.getNext()
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
            'sizeFactor'
        ]),
    },

    methods: {
        ...mapActions([
            'afterSpeak',
        ]),

        // Move on to the next word. This does the following in order:
        // Animates out the current word if shown
        // Displays the new target word
        // Prompts the user to begin speaking if they havent said any words yet
        async getNext () {
            this.queuedCallback = null
            if (this.curWord === this.wordList.length - 1) {
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
                // move on to next word
                this.curWord++
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
                        var recording = new Sound(this.filePath, '', (error) => {
                            if (error) {
                                console.log('failed to load the sound', error)
                                this.reviewed = true
                                this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                            }

                            
                            this.audioDetails.push({
                                startTime: this.audioBegins, 
                                recordingLength: recording.getDuration() - Math.max(this.audioBegins - 0.2, 0)
                            })
                            // Set the recording to start at 0.2 second before we heard the user start speaking
                            recording.setCurrentTime(Math.max(this.audioBegins - 0.2, 0))
                            // After it plays, read the word a final time
                            let callback = (success) => {
                                this.reviewed = true
                                recording.release()
                                this.finishedTargetWord()
                            }
                            // play the recording
                            recording.play(callback)
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
            AudioRecorder.requestAuthorization().then((isAuthorized) => {
                AudioRecorder.prepareRecordingAtPath(this.filePath, { MeteringEnabled: true, AudioEncoding: "aac" })
                this.currentMetering = 0
                this.hasAudio = false
                this.audioBegins = 0
                this.silenceDuration = 999
                // this is just for logging incase i need to debug
                AudioRecorder.onFinished = (data) => {
                    if (!data) return
                    console.log("finished recording")
                    console.log(data.status)
                    console.log(data.audioFileURL)
                    console.log(data.audioFileSize)
                }
                // keep track of metering
                AudioRecorder.onProgress = (data) => {
                    this.currentMetering = data.currentMetering
                    let levelRequired = Platform.OS === 'android' ? 8000 : -40
                    if (this.currentMetering > levelRequired) {
                        this.hasAudio = true
                        this.silenceDuration = 0
                        if (this.audioBegins === 0) {
                            this.audioBegins = data.currentTime
                        }
                    }
                    else {
                        this.silenceDuration++
                        if (this.silenceDuration > 3 && this.hasAudio) {
                            this.stopRecording()
                        }
                    }
                }
                
                let callback = async () => {
                    this.narrating = false
                    this.$refs.targetWordRef.startHighlightRepeating()
                    this.manuallyReading = false
                    try { await AudioRecorder.startRecording() }
                    // more logs for later debugging
                    catch (error) { console.log ("recording error"); console.log(error) }
                }
                // we only prompt the user for the first word
                if (this.curWord === 0) {
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

        async stopRecording () {
            await AudioRecorder.stopRecording()
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
                    duration: 500,
                    useNativeDriver: false,
                }),
            ]).start(callback)
        },
    }


}
</script>


<style>
    .container {
        align-items: center;
        justify-content: center;
        flex: 1;
        flex-direction: row;
    }

    .word-to-speak {
        position: absolute;
        top: 0;
        align-self: center;
        margin-top: 50
    }
</style>