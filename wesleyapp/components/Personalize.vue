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
import ImagePicker from 'react-native-image-picker';

export default {
    data () {
        return {
            filterText: "",
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
            const options = {
                title: 'Select vertical picture of: ' + word,
                mediaType: 'photo',
                storageOptions: {
                    skipBackup: true,
                    path: 'wordPictures',
                },
            }
            ImagePicker.launchImageLibrary(options, (response) => {
                console.log('Response = ', response)

                if (response.didCancel) {
                    console.log('User cancelled image picker')
                } else if (response.error || !response) {
                    console.log('ImagePicker Error: ', response.error)
                    // TODO show error dialog 
                }
                else {
                    if (response.isVertical) {
                        const source = { uri: response.uri }
                        this.savePicture({name: word, source, user: true})
                    }
                    else {
                        // TODO show vertical error dialog 
                    }
                }
            })
        },

        ...mapMutations([
            'setActivity',
        ]),

        ...mapActions([
            'savePicture'
        ],
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