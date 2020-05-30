<template>
    <animated:image
        :source="gifSource" 
        :style="{opacity: opacityGrowth._value,
                width: '100%',
                height: '100%'}">
</template>

<script>
import { Animated, Easing } from "react-native"
import { mapGetters } from 'vuex'

export default {
    data () {
        return {
            opacityGrowth: new Animated.Value(0),
            gifSource: null,
        }
    },

    computed: {
        ...mapGetters([
            'getPicture',
        ]),
    },

    mounted () {
        //choose a random gif
        var ran = Math.ceil(Math.random() * 15)
        this.levelUpSource = "LevelUpGif" + ran
        this.gifSource = this.getPicture(this.levelUpSource).source
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