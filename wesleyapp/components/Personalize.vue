<template>
    <view
        v-if="!recordingView"
        class="container">
        <modal
            animationType="fade"
            :transparent="true"
            :visible="showModal"
            :onRequestClose="() => {}">
            <touchable-opacity
                :class="'full-flex modal-background'"
                :activeOpacity="1"
                :onPress="modalCancel">
                <touchable-opacity
                    class="bottom-menu"
                    :activeOpacity="1"
                    :onPress="() => {}">
                    <touchable-opacity
                        v-if="canChangePicture"
                        :onPress="modalSelectNew"
                        :style="{marginBottom: paddingSize*1.5}">
                        <text
                            class="link-text"
                            :style="{fontSize: fontSize }">
                            Select new picture
                        </text>
                    </touchable-opacity>
                    <touchable-opacity
                        v-if="canRecord"
                        :onPress="modalRecordNew"
                        :style="{marginBottom: paddingSize*1.5}">
                        <text
                            class="link-text"
                            :style="{fontSize: fontSize }">
                            {{modalWordFullyRecorded? "Re-r" : "R"}}ecord reading voice
                        </text>
                    </touchable-opacity>
                    <touchable-opacity
                        v-if="hasUserPicture(modalWord)"
                        :onPress="modalRestoreDefaultPicture"
                        :style="{marginBottom: paddingSize*1.5}">
                        <text
                            class="link-text-danger"
                            :style="{fontSize: fontSize }">
                            Restore default picture
                        </text>
                    </touchable-opacity>
                    <touchable-opacity
                        v-if="modalWordFullyRecorded"
                        :onPress="modalRestoreDefaultRecording"
                        :style="{marginBottom: paddingSize*1.5}">
                        <text
                            class="link-text-danger"
                            :style="{fontSize: fontSize }">
                            Restore default voice
                        </text>
                    </touchable-opacity>
                    <touchable-opacity class="cancel-text" :onPress="modalCancel">
                        <text
                            class="cancel-text"
                            :style="{fontSize: fontSize * 1.5}">
                            Cancel
                        </text>
                    </touchable-opacity>
                </touchable-opacity>
            </touchable-opacity>
        </modal>
    
        <touchable-opacity
            :onPress="backHome"
            class="blue-box my-3"
            :style="[{paddingTop: paddingSize,
                    paddingBottom: paddingSize,
                    paddingRight: paddingSize * 1.5,
                    paddingLeft: paddingSize * 1.5 },
                    roundBox]">
            <text 
                :style="{fontSize: fontSize}"
                class="normal-text">
                Back
            </text>
        </touchable-opacity>
        
        <text-input
            v-model="filterText"
            placeholder="Search"
            class="white-box mb-8 link-text"
            :style="[{paddingTop: paddingSize / 1.5,
                    paddingBottom: paddingSize / 1.5,
                    paddingRight: paddingSize,
                    paddingLeft: paddingSize,
                    width: 300 * sizeFactor,
                    fontSize: fontSize / 1.5},
                    roundBox]"
            underlineColorAndroid="transparent" 
        />
    
        <scroll-view>
            <view class="grid-list">
                <touchable-opacity
                    v-for="word in filteredWords"
                    :onPress="() => clickWord(word)"
                    class="m-2">
                    <view
                        :style="[{paddingTop: paddingSize,
                                paddingBottom: paddingSize,
                                paddingRight: paddingSize * 1.5,
                                paddingLeft: paddingSize * 1.5 },
                                roundBox]"
                        class="blue-box">
                        <text 
                            :style="{fontSize: fontSize}"
                            class="normal-text">
                            {{ word }}
                        </text>
                    </view>
                </touchable-opacity>
            </view>
        </scroll-view>
    </view>
    <RecordWord
        v-else
        :wordList="wordsToRecord"
        :allDone="modalFinishRecording" />
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { Alert } from 'react-native'
import ImagePicker from 'react-native-image-picker/lib/commonjs';
import RecordWord from './RecordWord'

export default {
    props: {
        changeBackground: {
            type: Function,
            required: true
        },
    },
    
    components: {
        RecordWord,
    },

    data () {
        return {
            filterText: "",
            saidPrompt: 0,
            showModal: false,
            modalWord: "",
            recordingView: false,
            wordsToRecord: [],
            readSentenceCallback: null
        }
    },

    computed: {
        canRecord () {
            return this.modalWord !== "BackgroundImage" && this.modalWord !== "LevelUpGif"
        },

        modalWordAsObject () {
            return this.getWordOrLetter(this.modalWord) || {}
        },

        getWordRecordingList () {
            let wordOrLetter = this.modalWordAsObject
            let sentence = wordOrLetter.sentence || wordOrLetter.alliteration || ""
            return sentence.split(' ')
        },

        modalWordFullyRecorded () {
            if (this.modalWord && this.canRecord) {
                let allWords = this.getWordRecordingList
                for (let word of allWords) {
                    if (!this.hasUserRecording(word)) return false
                }
                return true
            }
            else {
                return false
            }
        },

        canChangePicture () {
            return this.getPictureNames.includes(this.modalWord)
        },

        filteredWords () {
            return this.getRecordingNames.concat(this.getPictureNames).concat(this.getLetterNames).filter(
                (word) => {
                    return word.toLowerCase().includes(this.filterText.toLowerCase())
                }
            )
        },

        ...mapGetters([
            'roundBox',
            'paddingSize',
            'paddingSizeSmall',
            'fontSizeSmall',
            'fontSize',
            'sizeFactor',
            'getPictureNames',
            'getLetterNames',
            'getRecordingNames',
            'hasUserPicture',
            'hasUserRecording',
            'getWordOrLetter'
        ]),
    },

    methods: {
        backHome () {
            this.readSentenceCallback = null
            this.setActivity({name: 'home'})
        },

        clickWord (word) {
            this.readSentenceCallback = null
            this.modalWord = word
            this.showModal = true
            if (this.canChangePicture) {
                this.changeBackground(word)
            }
            this.readCurSentence()
        },

        readCurSentence () {
            let sentence = this.getWordRecordingList
            let i = -1
            // if there's another sentence being read,
            // we wait here for a split second to let the current word being read finish
            // then that sentence is cut off and we start our queued sentence
            let waitToFinish = () => {
                // the waiting loop
                if (this.curReading) {
                    setTimeout(waitToFinish, 50)
                }
                // cur word is done reading, move on to the queued sentence
                else {
                    this.readSentenceCallback = () => {
                        i++
                        if (i < sentence.length && this.readSentenceCallback) {
                            this.curReading = true
                            this.afterSpeak({word: sentence[i], callback: this.readSentenceCallback})
                        }
                        else {
                            this.curReading = false
                        }
                    }
                    this.readSentenceCallback()
                }
            }
            waitToFinish()
        },

        changeWord (word) {
            if(this.saidPrompt < 2) {
                this.afterSpeak({word: 'Select a picture for ' + word})
                this.saidPrompt++
            }
            const options = {
                title: 'Select vertical picture of: ' + word,
                mediaType: 'photo',
                storageOptions: {
                    skipBackup: true,
                    path: 'wordPictures',
                },
            }
            // open the image picker so they can override the word's picture
            ImagePicker.launchImageLibrary(options, async (response) => {
                if (response.didCancel) {
                    console.log('User cancelled image picker')
                } else if (response.error || !response) {
                    Alert.alert(
                        'Upload Failed: Please try again',
                        [
                            {text: 'OK', onPress: () => {}},
                        ],
                        {cancelable: true},
                    )
                }
                else {
                    // success!
                    const source = { uri: response.uri }
                    await this.savePicture({name: word, source, user: true})
                }
                // now show the user what the word's picture is, whether it changed or not
                this.changeBackground(word)
            })
        },

        modalSelectNew () {
            this.readSentenceCallback = null
            this.showModal = false
            this.changeWord(this.modalWord)
        },

        modalRecordNew () {
            if (this.showModal) {
                this.showModal = false
                this.readSentenceCallback = null
                this.wordsToRecord = this.getWordRecordingList
                // dont re-record words, unless all words are recorded, in which case re-record all
                if (!this.modalWordFullyRecorded) {
                    this.wordsToRecord = this.wordsToRecord.filter((word => {
                        return !this.hasUserRecording(word)
                    }))
                }
                //this.shuffleArray(this.wordsToRecord)
                // we wait for any words/sentence being read to finish their current word 
                // otherwise itll overlap our prompt
                let waitToFinish = () => {
                    if (this.curReading) {
                        setTimeout(waitToFinish, 50)
                    }
                    else {
                        this.recordingView = true
                    }
                }
                waitToFinish()
            }
        },

        async modalFinishRecording (audioDetails) {
            this.recordingView = false
            await this.saveRecordings({names: this.wordsToRecord, audioDetails})
            this.readCurSentence()
        },

        async modalRestoreDefaultPicture () {
            await this.invalidatePicture(this.modalWord)
            this.changeBackground(this.modalWord)
        },

        async modalRestoreDefaultRecording () {
            this.readSentenceCallback = null
            let allWords = this.getWordRecordingList
            for (let word of allWords) {
                await this.invalidateRecording(word)
            }
            this.readCurSentence()
        },

        modalCancel () {
            this.readSentenceCallback = null
            this.showModal = false
        },

        shuffleArray (a) {
            var j, x, i
            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1))
                x = a[i]
                a[i] = a[j]
                a[j] = x
            }
        },

        ...mapMutations([
            'setActivity'
        ]),

        ...mapActions([
            'savePicture',
            'saveRecordings',
            'afterSpeak',
            'invalidatePicture',
            'invalidateRecording'
        ]),
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

    .grid-list {
        align-items: center;
        justify-content: center;
        flex-direction: row;
        flex-wrap: wrap;
    }

    .blue-box {
        background-color: 'rgb(0, 119, 179)';
    }

    .white-box {
        background-color: 'rgb(255, 255, 255)';
    }

    .link-text {
        color: 'rgb(0, 119, 179)';
    }

    .cancel-text {
        align-self: stretch;
        text-align: center;
        color: 'rgb(0, 59, 89)';
    }

    .link-text-danger {
        color: 'rgb(207, 0, 0)';
    }

    .normal-text {
        color: white;
    }

    .mb-8 {
        margin-bottom: 40
    }

    .my-3 {
        margin-top: 15;
        margin-bottom: 15;
    }

    .m-2 {
        margin: 10
    }

    .full-flex {
        flex: 1;
    }
    
    .modal-background {
        background-color:'rgba(0,0,0,0.3)';
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-end;
    }

    .bottom-menu {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 25px;
        width: 100%;
        background-color:'rgb(255,255,255)';
    }
</style>