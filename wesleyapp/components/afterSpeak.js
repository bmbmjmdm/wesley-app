export default function afterSpeak (tts, word, after)  {
    ttsSave = tts
    afterSave = after
    tts.addEventListener('tts-finish', afterSpeakHelper)
    tts.getInitStatus().then(() => tts.speak(word))
}
var ttsSave
var afterSave
function afterSpeakHelper () {
    ttsSave.removeEventListener('tts-finish', afterSpeakHelper)
    afterSave()

}