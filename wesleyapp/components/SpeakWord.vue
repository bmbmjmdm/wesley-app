<!-- This is copied by RecordWord. Idealy this code wouldn't be duplicated but thats low priority atm. ANY CHANGE TO THIS NEEDS TO UPDATE RecordWord TOO -->
<template>
    <view class="container">
        <view
            class="word-to-speak"
            :style="{marginTop: 50 * sizeFactor}">
            <Word
                v-if="shouldShowTargetWord && showWord"
                ref="targetWordRef"
                :key="curWord.targetWord"
                :word="curWord.targetWord"
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
        randomActivity: {
            type: Function,
            required: true
        },
        defaultBackground: {
            type: Function,
            required: true
        },
        changeBackground: {
            type: Function,
            required: true
        },
        playRandomSound: {
            type: Function,
            required: true
        },
        sayGJ: {
            type: Function,
            required: true
        },
        sayLevelUp: {
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
            curWord: {targetWord: ""},
            manuallyReading: false,
            showWord: false,
            wordsSpoken: 0,
            userSpoke: false,
            reinforced: false,
            filePath: AudioUtils.DocumentDirectoryPath + '/tempFile.aac',
            hasAudio: false,
            currentMetering: 0,
            audioBegins: 0,
            showMic: true,
            silenceDuration: 999,
            maxGrowth: new Animated.Value(0),
            queuedCallback: null,
            prompted: 0,
        }
    },

    mounted () {
        this.getNext()
    },

    computed: {
        // currently we show the target word on all difficulties
        shouldShowTargetWord () {
            //return this.difficultyReading < difficulty.HARD
            return true
        },
        // we read target word on easy + medium
        shouldReadTargetWord () {
            return this.difficultyReading <= difficulty.MEDIUM
        },
        // we show picture on medium
        shouldShowPicture () {
            return this.difficultyReading <= difficulty.MEDIUM
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
            'difficultyReading',
            'getNextWord',
            'sizeFactor'
        ]),
    },

    methods: {
        ...mapActions([
            'afterSpeak',
            'afterSpeakSentence',
            'finishLevelUp'
        ]),

        // Move on to the next target word. This does the following in order:
        // Animates out the current target word if shown
        // Loads the new image and sets it as the background
        // Displays the new target word if on easy/medium and reads it if on easy
        // Prompts the user to begin speaking
        async getNext () {
            this.queuedCallback = null
            await this.finishLevelUp()
            // after 4 words spoken, go on to next activity
            if (this.wordsSpoken >= 4) {
                this.randomActivity()
            }
            // still in this activity, go on to next word
            else {
                if (!this.shouldShowPicture) this.defaultBackground()
                // disable interaction
                this.manuallyReading = true
                this.narrating = true
                // reset finished state
                this.userSpoke = false
                this.reinforced = false
                // hide these while we switch curWord
                this.showWord = false
                // move on to next word
                this.curWord = this.getNextWord()
                // show image and change background
                this.fadeNewBackground()
            }
        },

        fadeNewBackground () {
            let callback = () => {
                // new image is now displayed as background, animate in target word
                // prepare the callback for after animation finishes
                this.queuedCallback = () => {
                    // speak and highlight the word
                    if (this.shouldReadTargetWord) {
                        this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                    }
                    // just speak it
                    else {
                        this.finishedTargetWord()
                    }
                }
                //initiate animation
                this.showWord = true
                if (this.shouldShowTargetWord) {
                    // we dont care if the mic doesnt finish animating before reading the word, so no need for queuedCallbacks
                    this.animateGrowth(true)
                }
                // if were in hard mode theres no word shown, so add the callback
                // to this animation instead
                else {
                    this.animateGrowth(true, this.queuedCallback)
                }
            }
            // we only show the word picture if we're on MED difficulty
            if (this.shouldShowPicture) this.changeBackground(this.curWord.targetWord, callback)
            else callback()
        },

        finishedTargetWord () {
            if (this.narrating) {
                // we're reinforcing the user's reading, 
                if (this.userSpoke) {
                    // we already played their recording back to them, now finish
                    if (this.reinforced) {
                        this.doneReinforcing()
                    }
                    // load the recording
                    else {
                        var recording = new Sound(this.filePath, '', (error) => {
                            if (error) {
                                console.log('failed to load the sound', error)
                                this.reinforced = true
                                if (this.shouldShowTargetWord) {
                                    this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                                }
                                else {
                                    this.afterSpeak({ word: this.curWord.targetWord, callback: this.finishedTargetWord })
                                }
                                return
                            }

                            // Set the recording to start at 0.1 second before we heard the user start speaking
                            recording.setCurrentTime(Math.max(this.audioBegins - 0.1, 0))
                            // After it plays, read the word a final time
                            let callback = (success) => {
                                recording.release()
                                this.reinforced = true
                                if (this.shouldShowTargetWord) {
                                    this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                                }
                                else {
                                    this.afterSpeak({ word: this.curWord.targetWord, callback: this.finishedTargetWord })
                                }
                            }
                            // play the recording
                            recording.play(callback)
                            // make sure it doesn't play for more than 2 seconds
                            setTimeout(() => {
                                if (!this.reinforced) {
                                    recording.stop()
                                    callback()
                                }
                            }, 3000)

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
            // request authorization until user accepts
            let requestLoop = () => {
                AudioRecorder.requestAuthorization().then((isAuthorized) => {
                    if (!isAuthorized) return requestLoop()

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
                        this.currentMetering = data.currentMetering
                        let levelRequired = Platform.OS === 'android' ? 8000 : -25
                        // They're speaking
                        if (this.currentMetering > levelRequired) {
                            this.hasAudio = true
                            this.silenceDuration = 0
                            if (this.audioBegins === 0) this.audioBegins = data.currentTime
                        }
                        // They've stopped speaking (or havent started yet)
                        else {
                            this.silenceDuration++
                            if (this.silenceDuration > 15 && this.hasAudio) {
                                this.stopRecording()
                                return
                            }
                        }
                        // auto stop after 3 seconds of recording
                        if (this.hasAudio && data.currentTime - this.audioBegins > 3) {
                            this.stopRecording()
                            return
                        }
                    }
                    
                    let prompt = "Please read the word out loud"
                    if (!this.shouldShowTargetWord) {
                        prompt = "What's the picture of? Say it out loud"
                    }
                    let callback = async () => {
                        this.prompted++
                        this.narrating = false
                        this.$refs.targetWordRef.startHighlightRepeating()
                        this.manuallyReading = false
                        setTimeout(this.tryStopRecording, 5000)
                        try { await AudioRecorder.startRecording() }
                        // more logs for later debugging
                        catch (error) { console.log ("recording error"); console.log(error) }
                        
                    }

                    // limit the number of times we prompt them
                    let maxPrompt = 99
                    if (this.difficultyReading === difficulty.MEDIUM) maxPrompt = 2
                    else if (this.difficultyReading === difficulty.HARD) maxPrompt = 1
                    if (this.prompted >= maxPrompt) {
                        callback()
                    }
                    else {
                        this.afterSpeakSentence({
                            sentence: prompt,
                            callback
                        })
                    }
                    
                })
            }
            // start loop
            requestLoop()
        },

        // The user needs another prompt if they havent started recording yet
        async tryStopRecording () {
            if (!this.hasAudio) {
                this.prompted = 0
                this.stopRecording()
            }
        },

        async stopRecording () {
            try {
                await AudioRecorder.stopRecording()
            }
            catch (error) {console.log(error)}
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
                //read the target word to reinforce and let user self-learn
                if (this.shouldShowTargetWord) {
                    this.$refs.targetWordRef.readWord(this.finishedTargetWord)
                }
                else {
                    this.afterSpeak({ word: this.curWord.targetWord, callback: this.finishedTargetWord })
                }
            }
            else {
                this.narrating = true
                this.manuallyReading = true
                this.promptSpeaking()
            }
        },

        doneReinforcing () {
            // prepare the callback for after animation finishes
            this.queuedCallback = () => {
                this.showWord = false
                this.wordsSpoken ++
                // next word/sentence
                this.sayGJ(this.getNext)
            }
            // next tick so everything picks up the queuedCallback
            Vue.nextTick(() => {
                // play a pleasant sound before moving on
                this.playRandomSound()
                // animate out our word if it exists
                if (this.shouldShowTargetWord) {
                    this.$refs.targetWordRef.animateOut()
                    this.animateGrowth(false)
                }
                else {
                    this.animateGrowth(false, this.queuedCallback)
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
    }
</style>