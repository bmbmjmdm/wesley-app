<template>
    <view class="container">
        <view class="word-to-speak">
            <Word
                v-if="shouldShowTargetWord && showWord"
                ref="targetWordRef"
                :key="curWord.targetWord"
                :word="curWord.targetWord"
                :wordPressed="finishedTargetWord"
                :setManuallyReading="setManuallyReading"
                :manuallyReading="manuallyReading"
                :narrating="false"
                :continueSentence="()=>{}" />
        </view>
        <view>
        </view>
    </view>
</template>

<script>
import Word from './Word'
import { mapGetters, mapMutations, mapActions } from 'vuex'
import SoundRecorder from 'react-native-sound-recorder'
import Sound  from 'react-native-sound'

export default {
    props: {
        randomActivity: {
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
        }
    },
    
    components: {
        Word,
    },

    data () {
        return {
            narrating: false,
            curWord: {targetWord: "", pic: null},
            manuallyReading: false,
            showWord: false,
            wordsSpoken: 0,
            userSpoke: false,
            reinforced: false,
        }
    },

    mounted () {
        this.getNext()
    },

    computed: {
        // we show target word on easy/medium
        shouldShowTargetWord () {
            return this.difficultyReading !== "hard"
        },
        // we read target word on easy
        shouldReadTargetWord () {
            return this.difficultyReading === "easy"
        },
        
        ...mapGetters([
            'difficultyReading',
            'getNextWord'
        ]),
    },

    methods: {
        ...mapActions([
            'afterSpeak'
        ]),

        // Move on to the next target word. This does the following in order:
        // Animates out the current target word if shown
        // Loads the new image and sets it as the background
        // Displays the new target word if on easy/medium and reads it if on easy
        // Prompts the user to begin speaking
        getNext () {
            // after 4 words spoken, go on to next activity
            if (this.wordsSpoken >= 4) {
                this.randomActivity()
            }
            // still in this activity, go on to next word
            else {
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
            this.changeBackground(this.curWord.pic, () => {
                // new image is now displayed as background, animate in target word
                this.showWord = true
                var wordAnimateTime = 700
                if (!this.shouldShowTargetWord) {
                    wordAnimateTime = 0
                }
                // timeout is to allow word animation to finish
                // if were in hard mode theres no animation so timeout time is 0
                setTimeout(() => {
                    // speak and highlight the word
                    if (this.shouldReadTargetWord) {
                        this.$refs.targetWordRef.readWord()
                    }
                    // just speak it
                    else {
                        this.finishedTargetWord()
                    }
                }, wordAnimateTime)
            })
        },

        finishedTargetWord () {
            if (this.narrating) {
                // we're reinforcing the user's reading, 
                if (this.userSpoke) {
                    // we already played their recording back to them, now finish
                    if (this.reinforced) {
                        this.doneReinforcing()
                    }
                    // play their recording back to them
                    else {
                        var recording = new Sound('tempFile.mp4', SoundRecorder.PATH_CACHE, (error) => {
                            if (error) {
                                console.log('failed to load the sound', error)
                                this.reinforced = true
                                if (this.shouldShowTargetWord) {
                                    this.$refs.targetWordRef.readWord()
                                }
                                else {
                                    this.afterSpeak(this.curWord.targetWord, this.finishedTargetWord)
                                }
                            }

                            // After it plays, read the word a final time
                            recording.play((success) => {
                                this.reinforced = true
                                if (this.shouldShowTargetWord) {
                                    this.$refs.targetWordRef.readWord()
                                }
                                else {
                                    this.afterSpeak(this.curWord.targetWord, this.finishedTargetWord)
                                }
                            })
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
            let prompt = "Please read the word out loud"
            if (!this.shouldShowTargetWord) {
                prompt = "What's the picture of? Say it out loud"
            }
            this.afterSpeak({
                word: prompt,
                callback: () => {
                    this.narrating = false
                    this.manuallyReading = false
                    SoundRecorder.start(SoundRecorder.PATH_CACHE + '/tempFile.mp4')
                    setTimeout(this.finishRecording, 5000)
                }
            })
        },

        // The recording time is done, stop recording and either re-prompt the user or move on to the next word
        finishRecording () {
            SoundRecorder.stop().then((result) => {
                if (DECIBLES) {
                    // set this to prevent the user from pressing buttons during transition
                    this.narrating = true
                    this.manuallyReading = true

                    // indicate we're in a finished state
                    this.userSpoke = true
                    //read the target word to reinforce and let user self-learn
                    if (this.shouldShowTargetWord) {
                        this.$refs.targetWordRef.readWord()
                    }
                    else {
                        this.afterSpeak(this.curWord.targetWord, this.finishedTargetWord)
                    }
                }
                else {
                    this.narrating = true
                    this.manuallyReading = true
                    this.promptSpeaking()
                }
            })
            .catch((error) => {
                console.log(error)
                this.narrating = true
                this.manuallyReading = true
                this.promptSpeaking()
            })
        },

        doneReinforcing () {
            // play a pleasant sound before moving on
            this.playRandomSound((success) => {
                let timeoutTime = 525
                // animate out our word
                if (this.shouldShowTargetWord) {
                    this.$refs.targetWordRef.animateOut()
                    timeoutTime = 0
                }
                this.showWord = false

                // timeout to allow animations to finish
                setTimeout(() => {
                    this.wordsSpoken ++
                    // next word/sentence
                    this.sayGJ(this.getNext)
                }, timeoutTime)
            })
        },

        setManuallyReading (val) {
            this.manuallyReading = val
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