import Sound  from 'react-native-sound'

export default function afterSpeak (tts, word, callback)  {
    var helper = () => {
        tts.removeEventListener('tts-finish', helper)
        callback()
    }
    tts.addEventListener('tts-finish', helper)
    tts.getInitStatus().then(() => tts.speak(word))
}

/*
    var sound = new Sound(String.toLowerCase(word) + '.wav', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
            console.log('failed to load sound: ' + word + '.wav', error)
            return
        } 
        sound.play(callback)
    })
*/