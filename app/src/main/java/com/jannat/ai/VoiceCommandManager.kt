package com.jannat.ai

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.Locale

/**
 * VoiceCommandManager manages speech-to-text (Bengali & English) and text-to-speech output.
 */
class VoiceCommandManager(
    private val context: Context,
    private val listener: VoiceListener
) : RecognitionListener {

    companion object {
        private const val TAG = "VoiceCommandManager"
    }

    interface VoiceListener {
        fun onListeningStateChanged(isListening: boolean)
        fun onCommandReceived(rawCommand: String)
        fun onVoiceError(errorMessage: String)
    }

    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    private var isTtsReady = false
    private var isCurrentlyListening = false

    init {
        initSpeechRecognizer()
        initTextToSpeech()
    }

    private fun initSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(this@VoiceCommandManager)
            }
        } else {
            Log.w(TAG, "SpeechRecognizer is not available on this device.")
        }
    }

    private fun initTextToSpeech() {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                // Try setting Bengali locale
                val bengaliLocale = Locale("bn", "BD")
                val result = tts?.setLanguage(bengaliLocale)

                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.w(TAG, "Bengali TTS voice not installed, falling back to default locale.")
                    tts?.language = Locale.getDefault()
                }
                tts?.setSpeechRate(0.95f)
                tts?.setPitch(1.05f)
                isTtsReady = true
            } else {
                Log.e(TAG, "Failed to initialize TextToSpeech: status=$status")
            }
        }
    }

    /**
     * Starts listening for Bengali or English voice commands.
     */
    fun startListening() {
        if (isCurrentlyListening) {
            Log.d(TAG, "Already listening.")
            return
        }

        // Stop any ongoing speech before listening
        tts?.stop()

        if (speechRecognizer == null) {
            initSpeechRecognizer()
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "bn-BD")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "bn-BD")
            putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, "bn-BD")
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra("android.speech.extra.EXTRA_ADDITIONAL_LANGUAGES", arrayOf("en-US", "bn-IN"))
        }

        try {
            speechRecognizer?.startListening(intent)
            isCurrentlyListening = true
            listener.onListeningStateChanged(true)
            Log.d(TAG, "Speech recognition started.")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start speech recognizer: ${e.message}")
            isCurrentlyListening = false
            listener.onListeningStateChanged(false)
            listener.onVoiceError("ভয়েস রিকগনিশন চালু করা যায়নি।")
        }
    }

    /**
     * Stops listening.
     */
    fun stopListening() {
        if (!isCurrentlyListening) return
        try {
            speechRecognizer?.stopListening()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recognizer: ${e.message}")
        }
        isCurrentlyListening = false
        listener.onListeningStateChanged(false)
    }

    /**
     * Speaks the message in friendly Bengali speech.
     */
    fun speak(text: String) {
        if (!isTtsReady || tts == null) {
            Log.w(TAG, "TTS not ready to speak: $text")
            return
        }

        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "JANNAT_TTS_${System.currentTimeMillis()}")
    }

    // RecognitionListener Callbacks
    override fun onReadyForSpeech(params: Bundle?) {
        Log.d(TAG, "Ready for speech")
    }

    override fun onBeginningOfSpeech() {
        Log.d(TAG, "Speech beginning detected")
    }

    override fun onRmsChanged(rmsdB: Float) {}

    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
        Log.d(TAG, "Speech ended")
        isCurrentlyListening = false
        listener.onListeningStateChanged(false)
    }

    override fun onError(error: Int) {
        isCurrentlyListening = false
        listener.onListeningStateChanged(false)

        val message = when (error) {
            SpeechRecognizer.ERROR_AUDIO -> "অডিও রেকর্ডিংয়ে সমস্যা হয়েছে।"
            SpeechRecognizer.ERROR_CLIENT -> "ক্লায়েন্ট এরর।"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "মাইক্রোফোন পারমিশন দেওয়া হয়নি।"
            SpeechRecognizer.ERROR_NETWORK -> "ইন্টারনেট সংযোগ চেক করুন।"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "নেটওয়ার্কের সময় শেষ।"
            SpeechRecognizer.ERROR_NO_MATCH -> "কথা স্পষ্ট শোনা যায়নি, অনুগ্রহ করে আবার বলুন।"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "ভয়েস সার্ভিস ব্যস্ত আছে।"
            SpeechRecognizer.ERROR_SERVER -> "সার্ভার এরর।"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "কোনো কথা শোনা যায়নি।"
            else -> "ভয়েস ইনপুট সমস্যা (কোড: $error)"
        }

        Log.w(TAG, "Speech recognition error: $message (code $error)")
        if (error != SpeechRecognizer.ERROR_NO_MATCH && error != SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
            listener.onVoiceError(message)
        }
    }

    override fun onResults(results: Bundle?) {
        isCurrentlyListening = false
        listener.onListeningStateChanged(false)

        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val spokenText = matches[0]
            Log.i(TAG, "Recognized command: '$spokenText'")
            listener.onCommandReceived(spokenText)
        }
    }

    override fun onPartialResults(partialResults: Bundle?) {}

    override fun onEvent(eventType: Int, params: Bundle?) {}

    fun destroy() {
        stopListening()
        speechRecognizer?.destroy()
        speechRecognizer = null

        tts?.stop()
        tts?.shutdown()
        tts = null
    }
}
