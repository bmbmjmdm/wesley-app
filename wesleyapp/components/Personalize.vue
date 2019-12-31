<template>
    <view class="container">
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
                    :onPress="() => changeWord(word)"
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
        }
    },

    computed: {
        filteredWords () {
            return this.getPictureNames.filter(
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
            'getPictureNames'
        ]),
    },

    methods: {
        changeWord (word) {
            if(this.saidPrompt < 2) {
                this.afterSpeak({word: 'Select a picture for ' + word, callback: () => {}})
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

        ...mapMutations([
            'setActivity',
        ]),

        ...mapActions([
            'savePicture',
            'afterSpeak'
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
</style>