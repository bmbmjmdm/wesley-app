<template>
    <view
        v-if="!recordingView"
        class="container"
        :class="{'normal-shadow': showPersonalizeIntro}">
        <view
            v-if="(curReading || loading) && !showModal"
            class="loading center-hor">
            <ActivityIndicator
                :style="{marginTop: 35 * sizeFactor}"
                size="large" />
        </view>

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
                    <view v-if="loading" class="loading center-no-flex">
                        <ActivityIndicator size="large" />
                    </view>
                    <template v-if="!bulkActions" class="centered pmb-5">
                        <touchable-opacity
                            v-if="canChangePicture"
                            :onPress="modalSelectNew"
                            :style="{marginBottom: paddingSize*1.5}">
                            <text
                                class="link-text center-text"
                                :style="{fontSize: fontSize }">
                                Select new picture
                            </text>
                        </touchable-opacity>
                        <touchable-opacity
                            v-if="canRecord"
                            :onPress="modalRecordNew"
                            :style="{marginBottom: paddingSize*1.5}">
                            <text
                                class="link-text center-text"
                                :style="{fontSize: fontSize }">
                                {{modalWordFullyRecorded ? "Re-r" : "R"}}ecord reading voice
                            </text>
                        </touchable-opacity>
                        <touchable-opacity
                            v-if="hasUserPicture(modalWord)"
                            :onPress="modalRestoreDefaultPicture"
                            :style="{marginBottom: paddingSize*1.5}">
                            <text
                                class="link-text-danger center-text"
                                :style="{fontSize: fontSize }">
                                Restore default picture
                            </text>
                        </touchable-opacity>
                        <touchable-opacity
                            v-if="modalWordFullyRecorded"
                            :onPress="modalRestoreDefaultRecording"
                            :style="{marginBottom: paddingSize*1.5}">
                            <text
                                class="link-text-danger center-text"
                                :style="{fontSize: fontSize }">
                                Restore default voice
                            </text>
                        </touchable-opacity>
                    </template>
                    <template v-else class="centered pmb-5">
                        <touchable-opacity
                            v-if="true"
                            :onPress="recordBulk"
                            :style="{marginBottom: paddingSize*1.5}">
                            <text
                                class="link-text center-text"
                                :style="{fontSize: fontSize }">
                                Record Voice in Bulk
                            </text>
                        </touchable-opacity>
                        <touchable-opacity
                            v-if="true"
                            :onPress="pictureBulk"
                            :style="{marginBottom: paddingSize*1.5}">
                            <text
                                class="link-text center-text"
                                :style="{fontSize: fontSize }">
                                Select Pictures in Bulk
                            </text>
                        </touchable-opacity>
                        <touchable-opacity
                            v-if="hasAnyUserPicture"
                            :onPress="restoreAllPictures"
                            :style="{marginBottom: paddingSize*1.5}">
                            <text
                                class="link-text-danger center-text"
                                :style="{fontSize: fontSize }">
                                {{ confirmRestorePictures ? "Please confirm, this will wipe all personalized pictures" : "Restore All Default Pictures" }}
                            </text>
                        </touchable-opacity>
                        <touchable-opacity
                            v-if="hasAnyUserRecording"
                            :onPress="restoreAllRecordings"
                            :style="{marginBottom: paddingSize*1.5}">
                            <text
                                class="link-text-danger center-text"
                                :style="{fontSize: fontSize }">
                                {{ confirmRestoreRecordings ? "Please confirm, this will wipe all personalized voices" : "Restore All Default Voices" }}
                            </text>
                        </touchable-opacity>
                    </template>
                    <touchable-opacity class="cancel-text pb-5" :onPress="modalCancel">
                        <text
                            class="cancel-text center-text"
                            :style="{fontSize: fontSize * 1.5}">
                            Cancel
                        </text>
                    </touchable-opacity>
                </touchable-opacity>
            </touchable-opacity>
        </modal>
    
        <View
            class="horizontal-spaced"
            :style="{marginTop: 15 * sizeFactor, marginBottom: 15 * sizeFactor}">
            <touchable-opacity
                :onPress="backHome"
                :class="{'blue-box': !showPersonalizeIntro, 'blue-shadow': showPersonalizeIntro}"
                :style="[{paddingTop: paddingSize,
                        paddingBottom: paddingSize,
                        paddingRight: paddingSize * 1.5,
                        paddingLeft: paddingSize * 1.5,
                        marginLeft: 15 * sizeFactor },
                        roundBox]">
                <text 
                    :style="{fontSize: fontSize}"
                    :class="{'normal-text': !showPersonalizeIntro, 'normal-text-shadow': showPersonalizeIntro}">
                    Back
                </text>
            </touchable-opacity>
            
            <touchable-opacity
                :onPress="clickBulk"
                class="blue-box"
                :style="[{paddingTop: paddingSize,
                        paddingBottom: paddingSize,
                        paddingRight: paddingSize * 1.5,
                        paddingLeft: paddingSize * 1.5,
                        marginRight: 15 * sizeFactor },
                        roundBox]">
                <text 
                    :style="{fontSize: fontSize}"
                    class="normal-text">
                    Bulk
                </text>
            </touchable-opacity>
        </View>
        
        <text-input
            v-if="!showPersonalizeIntro"
            v-model="filterText"
            placeholder="Search (or scroll)"
            class="white-box link-text"
            :style="[{paddingTop: paddingSize / 1.5,
                    paddingBottom: paddingSize / 1.5,
                    paddingRight: paddingSize,
                    paddingLeft: paddingSize,
                    width: 300 * sizeFactor,
                    fontSize: fontSize / 1.5,
                    marginBottom: 40 * sizeFactor},
                    roundBox]"
            underlineColorAndroid="transparent" 
        />
    
        <scroll-view
            v-if="!showPersonalizeIntro"
            ref="scrollRef"
            :onScroll="updateScrollPosition"
            :scrollEventThrottle="50">
            <view class="grid-list">
                <touchable-opacity
                    v-for="word in filteredWords"
                    :onPress="() => clickWord(word)"
                    :style="{margin: 10 * sizeFactor}">
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
        <touchable-opacity
            v-else
            :style="{padding: 25 * sizeFactor}"
            :onPress="finishPersonalizeIntro">
            <text
                class="normal-text"
                :style="{fontSize: fontSize}"
                :allowFontScaling="false">
                Here a list of a words, phrases, and letters will be listed that you can customize with your voice and pictures. Doing them one at a time is tiresome though, so feel free to use the bulk button above (~30min to record all words). Warning: Pictures used with this app should not be deleted from your phone, or else this app will automatically restore the default.
            </text>
        </touchable-opacity>
    </view>
    <RecordWord
        v-else
        ref="recordWordRef"
        :wordList="wordsToRecord"
        :bulkRecording="true"
        :allDone="modalFinishRecording" />
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { Alert, Platform } from 'react-native'
import ImagePicker from 'react-native-image-picker/lib/commonjs';
import RecordWord from './RecordWord'
import { ActivityIndicator } from 'react-native'
import { request, PERMISSIONS } from 'react-native-permissions'

export default {
    props: {
        changeBackground: {
            type: Function,
            required: true
        },
    },
    
    components: {
        RecordWord,
        ActivityIndicator,
    },

    data () {
        return {
            filterText: "",
            saidPrompt: 0,
            showModal: false,
            modalWord: "",
            recordingView: false,
            wordsToRecord: [],
            readSentenceCallback: null,
            bulkActions: false,
            confirmRestoreRecordings: false,
            confirmRestorePictures: false,
            preventRestore: false,
            bulkRecording: false,
            loading: false,
            curReading: false,
            scrollPosition: 0,
        }
    },

    computed: {
        canRecord () {
            return this.modalWord !== "BackgroundImage" && !this.modalWord.includes("LevelUpGif")
        },

        modalWordAsObject () {
            return this.getWordOrLetter(this.modalWord) || {}
        },

        getWordRecordingList () {
            let wordOrLetter = this.modalWordAsObject
            let sentence = wordOrLetter.sentence || wordOrLetter.alliteration || ""
            // append the letter to the words to be recorded if its a letter being pressed
            if (wordOrLetter.alliteration) {
                sentence = wordOrLetter.targetWord + " " + sentence
            }
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
            'hasAnyUserPicture',
            'hasAnyUserRecording',
            'getWordOrLetter',
            'getAllWordsToRecord',
            'getAllWordsNeedingPictures',
            'showPersonalizeIntro'
        ]),
    },

    methods: {
        backHome () {
            if (this.showPersonalizeIntro) return
            if (this.curReading || this.loading) return
            this.readSentenceCallback = null
            this.setActivity({name: 'home'})
        },

        clickBulk () {
            if (this.showPersonalizeIntro) return this.finishPersonalizeIntro()
            if (this.curReading || this.loading) return
            this.bulkActions = true
            this.showModal = true
        },

        clickWord (word) {
            if (this.curReading || this.loading) return
            this.readSentenceCallback = null
            this.modalWord = word
            this.showModal = true
            this.bulkActions = false
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
            if (this.saidPrompt < 2) {
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
            let launchIP = () => {
                ImagePicker.launchImageLibrary(options, async (response) => {
                    if (response.didCancel) {
                        console.log('User cancelled image picker')
                    } else if (response.error || !response) {
                        Alert.alert(
                            'Upload Failed: Please try again',
                            '',
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
            }
            if (Platform.OS === 'android') {
                launchIP()
            }
            else {
                this.loading = true
                request(PERMISSIONS.IOS.PHOTO_LIBRARY).then(() => {
                    this.loading = false
                    launchIP()
                })
            }
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
            await this.saveRecordings({audioDetails})
            if (!this.bulkRecording) {
                this.readCurSentence()
            }
            else {
                this.bulkRecording = false
            }
            setTimeout(() => {
                this.$refs.scrollRef.scrollTo({y: this.scrollPosition, animated: true})
            }, 100)
        },

        updateScrollPosition (event) {
            this.scrollPosition = event.nativeEvent.contentOffset.y
        },

        async forceSaveRecordings () {
            if (this.recordingView) {
                await this.saveRecordings({audioDetails: this.$refs.recordWordRef.audioDetails})
                this.$refs.recordWordRef.quit()
            }
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
            this.bulkActions = false
            this.confirmRestoreRecordings = false
            this.confirmRestorePictures = false
        },

        async restoreAllPictures () {
            if (this.preventRestore || this.loading) return
            if (!this.confirmRestorePictures) {
                this.confirmRestorePictures = true
                this.preventRestore = true
                setTimeout(() => this.preventRestore = false, 1000)
            }
            else {
                this.loading = true
                setTimeout(async () => {
                    await this.invalidateAllPictures()
                    this.confirmRestorePictures = false
                    this.loading = false
                }, 50)
            }
        },

        async restoreAllRecordings () {
            if (this.preventRestore || this.loading) return
            if (!this.confirmRestoreRecordings) {
                this.confirmRestoreRecordings = true
                this.preventRestore = true
                setTimeout(() => this.preventRestore = false, 1000)
            }
            else {
                this.loading = true
                setTimeout(async () => {
                    await this.invalidateAllRecordings()
                    this.confirmRestoreRecordings = false
                    this.loading = false
                }, 50)
            }
        },

        recordBulk () {
            if (this.showModal && !this.loading) {
                this.modalCancel()
                this.wordsToRecord = this.getAllWordsToRecord()
                this.bulkRecording = true
                this.recordingView = true
            }
        },

        pictureBulk () {
            if (this.showModal && !this.loading) {
                this.modalCancel()
                this.wordsToRecord = this.getAllWordsNeedingPictures()
                // loop through all those words and select a picture for each
                let callback = () => {
                    // exit condition
                    if (!this.wordsToRecord.length) return

                    let word = this.wordsToRecord.shift()
                    // full prompt if they just started, short after that
                    if(this.saidPrompt < 2) {
                        this.afterSpeak({word: 'Select a picture for ' + word})
                        this.saidPrompt++
                    }
                    else {
                        this.afterSpeak({word})
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
                    let launchIP = () => {
                        ImagePicker.launchImageLibrary(options, async (response) => {
                            if (response.didCancel) {
                                // TODO the user canceled, offer option to skip cur picture
                                Alert.alert(
                                    'Skip this picture or stop all together?',
                                    '',
                                    [
                                        {text: 'Stop', onPress: () => {}},
                                        {text: 'Skip', onPress: callback}
                                    ],
                                    {cancelable: true},
                                )
                            }
                            else if (response.error || !response) {
                                Alert.alert(
                                    'Upload Failed: Please try again',
                                    '',
                                    [
                                        {text: 'OK', onPress: () => {}}
                                    ],
                                    {cancelable: true},
                                )
                            }
                            else {
                                // success! save picture and loop
                                const source = { uri: response.uri }
                                this.savePicture({name: word, source, user: true})
                                callback()
                            }
                        })
                    }
                    // on IOS we have to get permission first
                    if (Platform.OS === 'android') {
                        launchIP()
                    }
                    else {
                        this.loading = true
                        request(PERMISSIONS.IOS.PHOTO_LIBRARY).then(() => {
                            this.loading = false
                            launchIP()
                        })
                    }
                }
                //initiate callback loop
                callback()
            }
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
            'setActivity',
            'finishPersonalizeIntro'
        ]),

        ...mapActions([
            'savePicture',
            'saveRecordings',
            'afterSpeak',
            'invalidatePicture',
            'invalidateRecording',
            'invalidateAllPictures',
            'invalidateAllRecordings'
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

    .horizontal-spaced {
        justify-content: space-between;
        flex-direction: row;
        width: 100% 
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
        width: 100%;
        background-color:'rgb(255,255,255)';
    }

    .pmb-5 {
        padding-top: 25px;
        padding-right: 25px;
        padding-left: 25px;
    }

    .pb-5 {
        padding-bottom: 25px;
    }

    .centered {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .center-text {
        text-align: center
    }

    .loading {
        position: absolute;
        z-index: 999;
        width: 100%;
        height: 100%;
        background-color:'rgba(0,0,0,0.3)';
    }

    .center-no-flex {
        justify-content: center;
        align-items: center;
    }

    .center-hor {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .blue-shadow {
        background-color: 'rgb(0, 36, 54)' !important;
    }

    .normal-shadow {
        background-color: 'rgba(0, 0, 0, 0.7)' !important;
    }

    .normal-text-shadow {
        color: 'rgb(76, 76, 76)';
    }
</style>