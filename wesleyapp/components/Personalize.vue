<template>
    <view class="container">
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
                        :onPress="modalRecordNew"
                        :style="{marginBottom: paddingSize*1.5}">
                        <text
                            class="link-text"
                            :style="{fontSize: fontSize }">
                            Record reading voice
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
                        v-if="hasUserRecording(modalWord)"
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
            :onPress="() => setActivity({name: 'home'})"
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
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { Alert } from 'react-native'
import ImagePicker from 'react-native-image-picker/lib/commonjs';

export default {
    props: {
        changeBackground: {
            type: Function,
            required: true
        },
    },

    data () {
        return {
            filterText: "",
            saidPrompt: 0,
            showModal: false,
            modalWord: "",
        }
    },

    computed: {
        canChangePicture () {
            return this.getPictureNames.includes(this.modalWord)
        },

        filteredWords () {
            return this.getPictureNames.concat(this.getLetterNames).filter(
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
            'hasUserPicture',
            'hasUserRecording'
        ]),
    },

    methods: {
        clickWord (word) {
            this.modalWord = word
            this.showModal = true
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
            ImagePicker.launchImageLibrary(options, (response) => {
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
                    this.savePicture({name: word, source, user: true})
                }
                // now show the user what the word's picture is, whether it changed or not
                setTimeout(() => this.changeBackground(word), 250)
            })
        },

        modalSelectNew () {
            this.showModal = false
            this.changeWord(this.modalWord)
        },

        modalRecordNew () {
            this.showModal = false
            // TODO ???
            // Record in batches
            // Randomize the words so they're not in a sentence
            // Prompt the user to unnunciate loudly in the beginning

            // I'm thinking the speakword screen, doing it all in rapid succession replacing the word on screen:
            // mic starts off and no word. Then word appears, being highlighted already and the mic now recording.
            // once it picks up your speech, it records until you stop talking, not 50 milliseconds more(?). It writes that down (not full save) and clears the word, turns the mic off. Repeat
            
            // use proper directory for saving user versions of words
            // be sure to call saveRecordings after the batch
        },

        modalRestoreDefaultPicture () {
            this.invalidatePicture(this.modalWord)
            setTimeout(() => this.changeBackground(this.modalWord), 250)
        },

        modalRestoreDefaultRecording () {
            this.invalidateRecording(this.modalWord)
            setTimeout(() => this.afterSpeak({word: this.modalWord}), 250)
        },

        modalCancel () {
            this.showModal = false
            this.changeBackground(this.modalWord)
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