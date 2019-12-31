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

export default {
    data () {
        return {
            opacityGrowth: new Animated.Value(0),
            gifSource: null,
            gifList: [gif1, gif2]
        }
    },

    mounted () {
        //choose a random gif
        this.gifSource = this.gifList[Math.round(Math.random() * this.gifList.length)]
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