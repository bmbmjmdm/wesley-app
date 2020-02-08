<template>
    <animated:image
        :source="gifSource" 
        :style="{opacity: opacityGrowth,
                width: '100%',
                height: '100%'}">
</template>

<script>
import { Animated, Easing } from "react-native"
import gif1 from "../assets/glitter1.gif"
import gif2 from "../assets/glitter2.gif"
import gif3 from "../assets/glitter3.gif"
import gif4 from "../assets/glitter4.gif"
import gif5 from "../assets/glitter5.gif"
import gif6 from "../assets/glitter6.gif"
import gif7 from "../assets/glitter7.gif"
import gif8 from "../assets/glitter8.gif"
import gif9 from "../assets/glitter9.gif"
import gif10 from "../assets/glitter10.gif"
import gif11 from "../assets/glitter11.gif"
import gif12 from "../assets/glitter12.gif"
import gif13 from "../assets/glitter13.gif"
import gif14 from "../assets/glitter14.gif"
import gif15 from "../assets/glitter15.gif"
import gif16 from "../assets/glitter16.gif"
import gif17 from "../assets/glitter17.gif"
import gif18 from "../assets/glitter18.gif"
import gif19 from "../assets/glitter19.gif"
import gif20 from "../assets/glitter20.gif"
import gif21 from "../assets/glitter21.gif"
import gif22 from "../assets/glitter22.gif"
import gif23 from "../assets/glitter23.gif"
import gif24 from "../assets/glitter24.gif"
import gif25 from "../assets/glitter25.gif"
import gif26 from "../assets/glitter26.gif"
import gif27 from "../assets/glitter27.gif"
import gif28 from "../assets/glitter28.gif"
import gif29 from "../assets/glitter29.gif"
import gif30 from "../assets/glitter30.gif"
import gif31 from "../assets/glitter31.gif"
import gif32 from "../assets/glitter32.gif"
import gif33 from "../assets/glitter33.gif"
import gif34 from "../assets/glitter34.gif"
import gif35 from "../assets/glitter35.gif"

export default {
    data () {
        return {
            opacityGrowth: new Animated.Value(0),
            gifSource: null,
            gifList: [gif1, gif2, gif3, gif4, gif5, gif6, gif7, gif8, gif9, gif10, gif11, gif12, gif13, gif14, gif15, gif16, gif17, gif18, gif19, gif20,
                      gif21, gif22, gif23, gif24, gif25, gif26, gif27, gif28, gif29, gif30, gif31, gif32, gif33, gif34, gif35]
        }
    },

    mounted () {
        let ran = Math.floor(Math.random() * this.gifList.length)
        //choose a random gif
        this.gifSource = this.gifList[ran]
        // we want to fade in
        this.animateOpacity(1)
    },

    methods: {
        animateOpacity (value) {
            var time = 500
            // Fade the gif in/out
            Animated.parallel([
                Animated.timing(this.opacityGrowth, {
                    toValue: value,
                    duration: time,
                    useNativeDriver: false,
                })
            ]).start()
        },

        animateOut () {
            this.animateOpacity(0)
        },
    }
}
</script>


<style>
</style>