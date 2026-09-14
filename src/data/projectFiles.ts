import { AndroidProjectFile } from '../types';

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: 'app/src/main/java/com/jannat/ai/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.jannat.ai

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.FloatingActionButton

/**
 * MainActivity for Jannat AI Assistant.
 *
 * Direct voice interaction flow:
 * Microphone -> Speech Recognition -> Bengali Text -> CommandProcessor -> Android Action -> Jannat Female Bengali Voice Response.
 *
 * Voice System:
 * - Tracks TextToSpeech state with ttsReady flag.
 * - Central speak(text: String) checks ttsReady, non-empty text, and speaks with QUEUE_FLUSH.
 * - Explicit "Test Voice" button for instant verification.
 * - Live TTS status display.
 */
class MainActivity : AppCompatActivity(), VoiceCommandManager.VoiceListener {

    private lateinit var appLauncher: AppLauncher
    private lateinit var diagnosticsManager: DiagnosticsManager
    private lateinit var safeRepairManager: SafeRepairManager
    private lateinit var jannatSettings: JannatSettings
    private lateinit var commandProcessor: CommandProcessor
    private lateinit var voiceCommandManager: VoiceCommandManager

    // Track TTS readiness
    private var ttsReady = false

    // UI View References
    private lateinit var tvStatus: TextView
    private lateinit var tvTtsStatus: TextView
    private lateinit var tvLiveNotice: TextView
    private lateinit var tvRecognizedCommand: TextView
    private lateinit var tvJannatResponse: TextView
    private lateinit var fabMic: FloatingActionButton
    private lateinit var btnStop: MaterialButton
    private lateinit var btnTestVoice: MaterialButton
    private lateinit var btnAccessibilitySettings: MaterialButton
    private lateinit var btnVoiceSettings: MaterialButton
    private lateinit var btnDiagnostics: MaterialButton
    private lateinit var btnAppSettings: MaterialButton
    private lateinit var tvServiceNotice: TextView

    // Audio Permission Launcher
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            startListeningInternal()
        } else {
            updateStatus(getString(R.string.status_error))
            tvJannatResponse.text = "ভয়েস কমান্ড শোনার জন্য মাইক্রোফোন অনুমতি প্রয়োজন।"
            Toast.makeText(this, "মাইক্রোফোন অনুমতি ছাড়া কথা বলা সম্ভব নয়।", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize Core Subsystems
        appLauncher = AppLauncher(this)
        diagnosticsManager = DiagnosticsManager(this)
        safeRepairManager = SafeRepairManager(this)
        jannatSettings = JannatSettings(this)
        commandProcessor = CommandProcessor(this, appLauncher, diagnosticsManager, safeRepairManager)
        voiceCommandManager = VoiceCommandManager(this, this, jannatSettings)

        initViews()
        setupListeners()
    }

    private fun initViews() {
        tvStatus = findViewById(R.id.tvStatus)
        tvTtsStatus = findViewById(R.id.tvTtsStatus)
        tvLiveNotice = findViewById(R.id.tvLiveNotice)
        tvRecognizedCommand = findViewById(R.id.tvRecognizedCommand)
        tvJannatResponse = findViewById(R.id.tvJannatResponse)
        fabMic = findViewById(R.id.fabMic)
        btnStop = findViewById(R.id.btnStop)
        btnTestVoice = findViewById(R.id.btnTestVoice)
        btnAccessibilitySettings = findViewById(R.id.btnAccessibilitySettings)
        btnVoiceSettings = findViewById(R.id.btnVoiceSettings)
        btnDiagnostics = findViewById(R.id.btnDiagnostics)
        btnAppSettings = findViewById(R.id.btnAppSettings)
        tvServiceNotice = findViewById(R.id.tvServiceNotice)

        updateStatus(getString(R.string.status_ready))
        tvTtsStatus.text = "TTS চালু হচ্ছে..."
        tvRecognizedCommand.text = "“ইউটিউব খোলো” অথবা “নিচে স্ক্রল করো” বলুন..."
        tvJannatResponse.text = "আসসালামু আলাইকুম! আমি জান্নাত। আপনাকে কীভাবে সাহায্য করতে পারি?"

        // Live preview notice
        tvLiveNotice.text = "Live Preview-তে native Android voice পরীক্ষা করা যাচ্ছে না। APK/Android emulator-এ পরীক্ষা করুন।"
    }

    private fun setupListeners() {
        // Microphone Action (Start Listening)
        fabMic.setOnClickListener {
            handleMicClick()
        }

        // Stop Action
        btnStop.setOnClickListener {
            voiceCommandManager.stopListening()
            voiceCommandManager.stopSpeaking()
            updateStatus(getString(R.string.status_ready))
        }

        // Explicit "🔊 Test Voice" Button
        btnTestVoice.setOnClickListener {
            handleTestVoiceClick()
        }

        // Accessibility Settings Navigation
        btnAccessibilitySettings.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(intent)
        }

        // Voice Settings Navigation -> Opens official Android TTS Settings page
        btnVoiceSettings.setOnClickListener {
            openAndroidTtsSettings()
        }

        // Diagnostics Navigation & Direct Execution
        btnDiagnostics.setOnClickListener {
            startActivity(Intent(this, DiagnosticsActivity::class.java))
        }

        // App Settings (Standard Android App Info)
        btnAppSettings.setOnClickListener {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", packageName, null)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(intent)
        }
    }

    /**
     * Handles Test Voice button click:
     * Jannat speaks "হ্যালো, আমি জন্নাত। আমি তোমার কথা শুনতে প্রস্তুত।"
     * If TTS not ready, displays "ভয়েস এখনো প্রস্তুত হচ্ছে।"
     */
    private fun handleTestVoiceClick() {
        val testPhrase = "হ্যালো, আমি জন্নাত। আমি তোমার কথা শুনতে প্রস্তুত।"
        if (!ttsReady) {
            tvTtsStatus.text = "ভয়েস এখনো প্রস্তুত হচ্ছে।"
            tvJannatResponse.text = "ভয়েস এখনো প্রস্তুত হচ্ছে। দয়া করে কয়েক সেকেন্ড অপেক্ষা করুন।"
            Toast.makeText(this, "ভয়েস এখনো প্রস্তুত হচ্ছে।", Toast.LENGTH_SHORT).show()
            return
        }

        tvJannatResponse.text = testPhrase
        speak(testPhrase)
    }

    /**
     * Central speak function:
     * - checks ttsReady (never calls speak before TTS init is complete)
     * - checks text is not empty
     * - uses TextToSpeech.QUEUE_FLUSH
     * - speaks using Android TextToSpeech
     * - catches errors without crashing
     * - updates UI status
     */
    private fun speak(text: String) {
        if (!ttsReady) {
            tvTtsStatus.text = "ভয়েস এখনো প্রস্তুত হচ্ছে।"
            Log.w("JannatVoice", "speak() called before TTS was ready: $text")
            return
        }

        val cleanText = text.trim()
        if (cleanText.isEmpty()) return

        try {
            voiceCommandManager.speak(cleanText)
        } catch (e: Exception) {
            Log.e("JannatVoice", "Error during speak(): \${e.message}", e)
            tvTtsStatus.text = "TTS error"
        }
    }

    /**
     * Opens official Android Text-to-Speech Settings so user can inspect Google TTS / Bengali voice pack.
     */
    private fun openAndroidTtsSettings() {
        try {
            val ttsIntent = Intent("com.android.settings.TTS_SETTINGS").apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(ttsIntent)
        } catch (e: Exception) {
            // Fallback to internal voice settings activity or general settings
            try {
                startActivity(Intent(this, SettingsActivity::class.java))
            } catch (err: Exception) {
                startActivity(Intent(Settings.ACTION_SETTINGS))
            }
        }
    }

    override fun onResume() {
        super.onResume()
        checkAccessibilityNotice()
    }

    private fun checkAccessibilityNotice() {
        val isServiceRunning = JannatAccessibilityService.isServiceRunning()
        if (isServiceRunning) {
            tvServiceNotice.visibility = View.GONE
        } else {
            tvServiceNotice.visibility = View.VISIBLE
            tvServiceNotice.text = "স্ক্রিন নেভিগেশন (ব্যাক, হোম, স্ক্রল, লক) এর জন্য Accessibility চালু করুন।"
        }
    }

    private fun handleMicClick() {
        if (voiceCommandManager.isListening()) {
            voiceCommandManager.stopListening()
            updateStatus(getString(R.string.status_ready))
            return
        }

        val hasMic = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (hasMic) {
            startListeningInternal()
        } else {
            requestPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    private fun startListeningInternal() {
        voiceCommandManager.startListening()
        updateStatus(getString(R.string.status_listening))
        tvRecognizedCommand.text = "শুনছি... আপনার নির্দেশ বলুন।"
    }

    private fun updateStatus(status: String) {
        tvStatus.text = status
        when (status) {
            getString(R.string.status_listening) -> {
                tvStatus.setTextColor(ContextCompat.getColor(this, R.color.teal_primary))
                fabMic.backgroundTintList = ContextCompat.getColorStateList(this, R.color.rose_accent)
            }
            getString(R.string.status_processing) -> {
                tvStatus.setTextColor(ContextCompat.getColor(this, R.color.amber_accent))
                fabMic.backgroundTintList = ContextCompat.getColorStateList(this, R.color.teal_primary)
            }
            else -> {
                tvStatus.setTextColor(ContextCompat.getColor(this, R.color.slate_subtext))
                fabMic.backgroundTintList = ContextCompat.getColorStateList(this, R.color.teal_primary)
            }
        }
    }

    // VoiceCommandManager.VoiceListener Callbacks
    override fun onTtsStatusChanged(statusText: String, isReady: Boolean) {
        runOnUiThread {
            ttsReady = isReady
            tvTtsStatus.text = statusText
            Log.i("JannatVoice", "TTS Status: $statusText, ready: $isReady")
        }
    }

    override fun onListeningStarted() {
        updateStatus(getString(R.string.status_listening))
    }

    override fun onListeningStopped() {
        updateStatus(getString(R.string.status_ready))
    }

    override fun onCommandReceived(rawCommand: String) {
        updateStatus(getString(R.string.status_processing))
        tvRecognizedCommand.text = "“$rawCommand”"

        // Process and immediately execute without asking "আপনি কি নিশ্চিত?"
        val result = commandProcessor.processCommand(rawCommand)
        tvJannatResponse.text = result.responseMessage
        updateStatus(if (result.isSuccess) getString(R.string.status_ready) else getString(R.string.status_error))

        // Mandatory: Speak response using native female Bengali voice
        if (jannatSettings.isVoiceFeedbackEnabled) {
            speak(result.responseMessage)
        }
    }

    override fun onVoiceError(errorMessage: String) {
        updateStatus(getString(R.string.status_error))
        tvJannatResponse.text = errorMessage
    }

    override fun onDestroy() {
        super.onDestroy()
        voiceCommandManager.destroy()
    }
}
`
  },
  {
    path: 'app/src/main/java/com/jannat/ai/VoiceCommandManager.kt',
    name: 'VoiceCommandManager.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.jannat.ai

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import android.util.Log
import java.util.Locale

/**
 * VoiceCommandManager handles:
 * - Speech-to-Text via Android SpeechRecognizer (bn-BD preference with en-US/bn-IN fallback)
 * - Female Bengali Text-to-Speech via Android native TextToSpeech engine
 * - Rigorous TTS state tracking (ttsReady boolean) to ensure speak() is never called prematurely
 * - Natural female voice timbre selection and pitch/rate calibration
 */
class VoiceCommandManager(
    private val context: Context,
    private val listener: VoiceListener,
    private val settings: JannatSettings
) : RecognitionListener {

    interface VoiceListener {
        fun onListeningStarted()
        fun onListeningStopped()
        fun onCommandReceived(rawCommand: String)
        fun onVoiceError(errorMessage: String)
        fun onTtsStatusChanged(statusText: String, isReady: Boolean)
    }

    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var isCurrentlyListening = false

    init {
        initSpeechRecognizer()
        initTextToSpeech()
    }

    private fun initSpeechRecognizer() {
        try {
            if (SpeechRecognizer.isRecognitionAvailable(context)) {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                    setRecognitionListener(this@VoiceCommandManager)
                }
            }
        } catch (e: Exception) {
            Log.w("JannatVoice", "SpeechRecognizer initialization warning: \${e.message}")
        }
    }

    /**
     * Initializes Android native TextToSpeech.
     * Guaranteed: speak() will never be called before ttsReady is set to true.
     */
    private fun initTextToSpeech() {
        listener.onTtsStatusChanged("TTS চালু হচ্ছে...", false)
        ttsReady = false

        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                configureFemaleBengaliVoice()
            } else {
                ttsReady = false
                listener.onTtsStatusChanged("TTS error", false)
                Log.e("JannatVoice", "TextToSpeech init failed with status: $status")
            }
        }
    }

    /**
     * Configures preferred bn-BD locale and selects an optimal female Bengali voice.
     * Prevents any crash if voice/language pack is missing.
     */
    fun configureFemaleBengaliVoice() {
        val ttsInstance = tts ?: return

        var isBengaliSupported = false

        // 1. Try Locale("bn", "BD")
        val bnBdLocale = Locale("bn", "BD")
        val resultBd = ttsInstance.setLanguage(bnBdLocale)
        if (resultBd != TextToSpeech.LANG_MISSING_DATA && resultBd != TextToSpeech.LANG_NOT_SUPPORTED) {
            isBengaliSupported = true
        } else {
            // Fallback to Locale("bn", "IN")
            val bnInLocale = Locale("bn", "IN")
            val resultIn = ttsInstance.setLanguage(bnInLocale)
            if (resultIn != TextToSpeech.LANG_MISSING_DATA && resultIn != TextToSpeech.LANG_NOT_SUPPORTED) {
                isBengaliSupported = true
            } else {
                // Fallback to generic Locale("bn")
                val bnLocale = Locale("bn")
                val resultBn = ttsInstance.setLanguage(bnLocale)
                if (resultBn != TextToSpeech.LANG_MISSING_DATA && resultBn != TextToSpeech.LANG_NOT_SUPPORTED) {
                    isBengaliSupported = true
                }
            }
        }

        // 2. Scan available voices for Female Bengali Voice
        var foundFemaleVoice = false
        try {
            val availableVoices = ttsInstance.voices
            if (!availableVoices.isNullOrEmpty()) {
                // Prefer female voice in Bengali
                val femaleVoice = availableVoices.firstOrNull { voice ->
                    val name = voice.name.lowercase()
                    val lang = voice.locale.language.lowercase()
                    lang.contains("bn") && (
                        name.contains("female") ||
                        name.contains("woman") ||
                        name.contains("#female") ||
                        name.contains("fem")
                    )
                }

                if (femaleVoice != null) {
                    ttsInstance.voice = femaleVoice
                    foundFemaleVoice = true
                    Log.i("JannatVoice", "Selected female Bengali voice: \${femaleVoice.name}")
                } else {
                    // Fallback to any Bengali voice
                    val anyBengaliVoice = availableVoices.firstOrNull { voice ->
                        voice.locale.language.lowercase().contains("bn")
                    }
                    if (anyBengaliVoice != null) {
                        ttsInstance.voice = anyBengaliVoice
                        Log.i("JannatVoice", "Selected standard Bengali voice: \${anyBengaliVoice.name}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.w("JannatVoice", "Voice scanning exception: \${e.message}")
        }

        // 3. Set female speech pitch and speech rate
        ttsInstance.setPitch(settings.speechPitch) // 1.15f for distinct female timbre
        ttsInstance.setSpeechRate(settings.speechRate) // 1.0f

        // 4. Mark TTS as ready and notify UI
        ttsReady = true

        if (isBengaliSupported || foundFemaleVoice) {
            listener.onTtsStatusChanged("বাংলা ভয়েস প্রস্তুত", true)
        } else {
            // Engine initialized, but Bengali language pack not downloaded yet on user's device
            listener.onTtsStatusChanged("বাংলা ভয়েস পাওয়া যায়নি", true)
        }
    }

    fun isListening(): Boolean = isCurrentlyListening

    fun isTtsReady(): Boolean = ttsReady

    fun startListening() {
        if (isCurrentlyListening) return
        stopSpeaking()

        if (speechRecognizer == null) {
            initSpeechRecognizer()
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "bn-BD")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "bn-BD")
            putExtra("android.speech.extra.EXTRA_ADDITIONAL_LANGUAGES", arrayOf("en-US", "bn-IN"))
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        }

        try {
            speechRecognizer?.startListening(intent)
            isCurrentlyListening = true
            listener.onListeningStarted()
        } catch (e: Exception) {
            isCurrentlyListening = false
            listener.onListeningStopped()
            listener.onVoiceError("ভয়েস রিকগনিশন চালু করা সম্ভব হয়নি।")
        }
    }

    fun stopListening() {
        if (!isCurrentlyListening) return
        try {
            speechRecognizer?.stopListening()
        } catch (e: Exception) {}
        isCurrentlyListening = false
        listener.onListeningStopped()
    }

    /**
     * Central speak function:
     * - checks ttsReady (never calls speak before TTS is ready)
     * - checks text is not empty
     * - uses TextToSpeech.QUEUE_FLUSH
     * - catches errors without crashing
     */
    fun speak(text: String) {
        if (!ttsReady || tts == null || !settings.isVoiceFeedbackEnabled) {
            Log.w("JannatVoice", "speak() skipped: ttsReady=$ttsReady, feedbackEnabled=\${settings.isVoiceFeedbackEnabled}")
            return
        }

        val cleanText = text.trim()
        if (cleanText.isEmpty()) return

        try {
            stopListening()
            tts?.speak(
                cleanText,
                TextToSpeech.QUEUE_FLUSH,
                null,
                "JANNAT_TTS_\${System.currentTimeMillis()}"
            )
        } catch (e: Exception) {
            Log.e("JannatVoice", "speak() execution error: \${e.message}", e)
        }
    }

    fun stopSpeaking() {
        try {
            tts?.stop()
        } catch (e: Exception) {}
    }

    fun getAvailableVoices(): List<Voice> {
        return try {
            tts?.voices?.filter { it.locale.language.contains("bn") }?.toList() ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun setSpecificVoice(voice: Voice) {
        tts?.voice = voice
    }

    // SpeechRecognizer Callbacks
    override fun onResults(results: Bundle?) {
        isCurrentlyListening = false
        listener.onListeningStopped()
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val command = matches[0]
            listener.onCommandReceived(command)
        } else {
            listener.onVoiceError("কোনো কথা স্পষ্টভাবে শনাক্ত করা যায়নি।")
        }
    }

    override fun onError(error: Int) {
        isCurrentlyListening = false
        listener.onListeningStopped()
        val msg = when (error) {
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "মাইক্রোফোন অনুমতি পাওয়া যায়নি।"
            SpeechRecognizer.ERROR_NETWORK -> "ইন্টারনেট সংযোগ সক্রিয় নেই।"
            SpeechRecognizer.ERROR_NO_MATCH -> "কথা স্পষ্ট বোঝা যায়নি, আবার বলুন।"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "কোনো কথা শোনা যায়নি।"
            else -> "ভয়েস সমস্যা (কোড: $error)"
        }
        listener.onVoiceError(msg)
    }

    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}

    fun destroy() {
        stopListening()
        try {
            speechRecognizer?.destroy()
        } catch (e: Exception) {}
        speechRecognizer = null

        stopSpeaking()
        try {
            tts?.shutdown()
        } catch (e: Exception) {}
        tts = null
        ttsReady = false
    }
}
`
  },
  {
    path: 'app/src/main/java/com/jannat/ai/CommandProcessor.kt',
    name: 'CommandProcessor.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.jannat.ai

import android.content.Context
import android.util.Log

/**
 * CommandProcessor processes natural Bengali voice commands and executes actions immediately.
 *
 * Direct action behavior:
 * - When the user gives a clear command, Jannat executes it immediately without asking "আপনি কি নিশ্চিত?".
 * - Every command response produces clean, friendly Bengali text specifically formatted to be spoken via TextToSpeech.
 */
class CommandProcessor(
    private val context: Context,
    private val appLauncher: AppLauncher,
    private val diagnosticsManager: DiagnosticsManager,
    private val safeRepairManager: SafeRepairManager
) {

    data class CommandResult(
        val type: CommandType,
        val responseMessage: String,
        val isSuccess: Boolean
    )

    enum class CommandType {
        APP_LAUNCH,
        SCREEN_BACK,
        SCREEN_HOME,
        SCREEN_LOCK,
        SCROLL_DOWN,
        SCROLL_UP,
        DIAGNOSTICS,
        SAFE_REPAIR,
        CONVERSATION,
        UNKNOWN
    }

    fun processCommand(rawInput: String): CommandResult {
        val input = rawInput.trim().lowercase()

        // Strip triggers (e.g. "জান্নাত", "jannat")
        val clean = input
            .replace("জান্নাত,", "")
            .replace("জান্নাত", "")
            .replace("jannat,", "")
            .replace("jannat", "")
            .trim()

        // 1. YouTube commands ("ইউটিউব খোলো", "ইউটিউব ওপেন করো", "YouTube-এ যাও", "ভিডিও ওপেন করো")
        if (clean.contains("ইউটিউব") || clean.contains("youtube") || clean.contains("ভিডিও ওপেন")) {
            return handleAppLaunch("ইউটিউব", "YouTube", "ইউটিউব খুলছি।")
        }

        // 2. Facebook ("ফেসবুক খোলো", "facebook")
        if (clean.contains("ফেসবুক") || clean.contains("facebook") || clean.contains("fb")) {
            return handleAppLaunch("ফেসবুক", "Facebook", "ফেসবুক খুলছি।")
        }

        // 3. Camera ("ক্যামেরা খোলো")
        if (clean.contains("ক্যামেরা") || clean.contains("camera")) {
            return handleAppLaunch("ক্যামেরা", "Camera", "ক্যামেরা খুলছি।")
        }

        // 4. Gallery / Photos ("গ্যালারি খোলো")
        if (clean.contains("গ্যালারি") || clean.contains("gallery") || clean.contains("ফটো")) {
            return handleAppLaunch("গ্যালারি", "Gallery", "গ্যালারি খুলছি।")
        }

        // 5. Messages ("মেসেজ খোলো")
        if (clean.contains("মেসেজ") || clean.contains("message") || clean.contains("বার্তা")) {
            return handleAppLaunch("মেসেজ", "Messages", "মেসেজ খুলছি।")
        }

        // 6. Phone / Dialer ("ফোন খোলো", "ডায়ালার খোলো")
        if (clean.contains("ডায়ালার") || clean.contains("dialer") || clean.contains("কল খোলো") || clean == "ফোন খোলো") {
            return handleAppLaunch("ফোন", "Phone", "ফোন ডায়ালার খুলছি।")
        }

        // 7. Settings ("সেটিংস খোলো")
        if (clean.contains("সেটিংস") || clean.contains("settings")) {
            return handleAppLaunch("সেটিংস", "Settings", "সেটিংস খুলছি।")
        }

        // 8. Chrome / Browser ("ক্রোম খোলো", "ব্রাউজার খোলো")
        if (clean.contains("ক্রোম") || clean.contains("chrome") || clean.contains("ব্রাউজার")) {
            return handleAppLaunch("ক্রোম ব্রাউজার", "Chrome", "ক্রোম ব্রাউজার খুলছি।")
        }

        // 9. Play Store ("প্লে স্টোর খোলো")
        if (clean.contains("প্লে স্টোর") || clean.contains("play store") || clean.contains("প্লেস্টোর")) {
            return handleAppLaunch("গুগল প্লে স্টোর", "Play Store", "প্লে স্টোর খুলছি।")
        }

        // 10. Generic App Launch ("WhatsApp খোলো", "Calculator খোলো", etc.)
        if (clean.contains("খোলো") || clean.contains("ওপেন করো") || clean.startsWith("open ")) {
            val appQuery = clean
                .replace("ওপেন করো", "")
                .replace("খোলো", "")
                .replace("open ", "")
                .trim()

            if (appQuery.isNotEmpty()) {
                return handleAppLaunch(appQuery, appQuery, "\$appQuery খুলছি।")
            }
        }

        // 11. Navigation: Back ("ব্যাক যাও", "পেছনে যাও", "পিছনে যাও", "back")
        if (clean.contains("ব্যাক যাও") || clean.contains("পেছনে যাও") || clean.contains("পিছনে যাও") || clean.contains("ব্যাক") || clean == "back") {
            return executeAccessibility(
                JannatAccessibilityService.ScreenAction.BACK,
                CommandType.SCREEN_BACK,
                "ব্যাক যাচ্ছি।"
            )
        }

        // 12. Navigation: Home ("হোমে যাও", "home")
        if (clean.contains("হোমে যাও") || clean.contains("হোম") || clean == "home") {
            return executeAccessibility(
                JannatAccessibilityService.ScreenAction.HOME,
                CommandType.SCREEN_HOME,
                "হোমে যাচ্ছি।"
            )
        }

        // 13. Screen Action: Scroll Down ("নিচে যাও", "নিচে স্ক্রল করো", "scroll down")
        if (clean.contains("নিচে যাও") || clean.contains("নিচে স্ক্রল") || clean.contains("স্ক্রল করো") || clean.contains("scroll down")) {
            return executeAccessibility(
                JannatAccessibilityService.ScreenAction.SCROLL_DOWN,
                CommandType.SCROLL_DOWN,
                "নিচে স্ক্রল করছি।"
            )
        }

        // 14. Screen Action: Scroll Up ("উপরে যাও", "উপরে স্ক্রল করো", "scroll up")
        if (clean.contains("উপরে যাও") || clean.contains("উপরে স্ক্রল") || clean.contains("scroll up")) {
            return executeAccessibility(
                JannatAccessibilityService.ScreenAction.SCROLL_UP,
                CommandType.SCROLL_UP,
                "উপরে স্ক্রল করছি।"
            )
        }

        // 15. Lock Screen: ("ফোন লক করো", "lock phone")
        if (clean.contains("ফোন লক করো") || clean.contains("লক করো") || clean.contains("lock phone")) {
            return executeAccessibility(
                JannatAccessibilityService.ScreenAction.LOCK_SCREEN,
                CommandType.SCREEN_LOCK,
                "ফোন লক করছি।"
            )
        }

        // 16. Phone Diagnostics: ("ফোন চেক করো", "ফোনের সমস্যা দেখো", "আমার ফোন ঠিক আছে কিনা দেখো")
        if (clean.contains("ফোন চেক করো") || clean.contains("সমস্যা দেখো") || clean.contains("ঠিক আছে কিনা") || clean.contains("ডায়াগনস্টিকস")) {
            val report = diagnosticsManager.getBengaliDiagnosticSummary()
            val spokenSummary = "আমি ফোনের প্রাথমিক পরীক্ষা করেছি। বড় কোনো সমস্যা পাওয়া যায়নি। $report"
            return CommandResult(CommandType.DIAGNOSTICS, spokenSummary, true)
        }

        // 17. Safe Repairs: ("ক্যাশ পরিষ্কার করো", "নেটওয়ার্ক রিফ্রেশ করো")
        if (clean.contains("ক্যাশ পরিষ্কার") || clean.contains("মেমরি পরিষ্কার")) {
            val ok = safeRepairManager.clearJannatInternalCache()
            return CommandResult(
                CommandType.SAFE_REPAIR,
                if (ok) "জান্নাত অ্যাপের সাময়িক ক্যাশ ফাইল সফলভাবে মুছে দেওয়া হয়েছে।" else "ক্যাশ ফাইলে কোনো বাড়তি ডেটা নেই।",
                true
            )
        }

        if (clean.contains("নেটওয়ার্ক ঠিক") || clean.contains("নেট রিফ্রেশ")) {
            val msg = safeRepairManager.refreshNetworkState()
            return CommandResult(CommandType.SAFE_REPAIR, msg, true)
        }

        // 18. Polite Friendly Inquiries
        val conversationResponse = handleConversation(clean)
        if (conversationResponse != null) {
            return CommandResult(CommandType.CONVERSATION, conversationResponse, true)
        }

        return CommandResult(
            CommandType.UNKNOWN,
            "দুঃখিত, নির্দেশটি বুঝতে পারিনি। আপনি “ইউটিউব খোলো”, “ব্যাক যাও”, অথবা “ফোন চেক করো” বলতে পারেন।",
            false
        )
    }

    private fun handleAppLaunch(appNameBn: String, appNameEn: String, spokenSuccessMsg: String): CommandResult {
        return when (val result = appLauncher.launchApp(appNameBn)) {
            is AppLauncher.LaunchResult.Success -> {
                CommandResult(CommandType.APP_LAUNCH, spokenSuccessMsg, true)
            }
            is AppLauncher.LaunchResult.AppNotInstalled -> {
                // Open Play Store search page, but never silently install
                val openedSearch = appLauncher.openPlayStoreSearch(result.appName)
                val msg = if (openedSearch) {
                    "“\${result.appName}” ফোনে ইনস্টল নেই। প্লে স্টোরে অ্যাপটি খোঁজা হচ্ছে।"
                } else {
                    "দুঃখিত, “\${result.appName}” ফোনে পাওয়া যায়নি।"
                }
                CommandResult(CommandType.APP_LAUNCH, msg, false)
            }
            is AppLauncher.LaunchResult.Error -> {
                CommandResult(CommandType.APP_LAUNCH, "ত্রুটি: \${result.message}", false)
            }
        }
    }

    private fun executeAccessibility(action: JannatAccessibilityService.ScreenAction, type: CommandType, successMsg: String): CommandResult {
        if (!JannatAccessibilityService.isServiceRunning()) {
            return CommandResult(type, "এই নির্দেশের জন্য Accessibility সার্ভিস চালু করা প্রয়োজন। সেটিংসে গিয়ে সার্ভিসটি চালু করুন।", false)
        }
        val ok = JannatAccessibilityService.performAction(action)
        return if (ok) {
            CommandResult(type, successMsg, true)
        } else {
            CommandResult(type, "স্ক্রিন অ্যাকশনটি এই মুহূর্তে কার্যকর করা যায়নি।", false)
        }
    }

    private fun handleConversation(input: String): String? {
        return when {
            input.contains("কেমন আছো") || input.contains("কেমন আছেন") -> {
                "আমি ভালো আছি। তোমার কেমন লাগছে?"
            }
            input.contains("কি করতেছো") || input.contains("কী করছো") || input.contains("কি করছো") -> {
                "আমি তোমার কমান্ডের অপেক্ষায় আছি।"
            }
            input.contains("সব ঠিকঠাক চলছে") || input.contains("সব ঠিক") -> {
                "হ্যাঁ, এখন পর্যন্ত সব ঠিকঠাক চলছে।"
            }
            input.contains("ধন্যবাদ") || input.contains("থ্যাংক") -> {
                "আপনাকেও অনেক ধন্যবাদ! সাহায্য করতে পেরে ভালো লাগল।"
            }
            else -> null
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/jannat/ai/AppLauncher.kt',
    name: 'AppLauncher.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.jannat.ai

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.MediaStore
import android.provider.Settings
import android.util.Log

/**
 * AppLauncher launches installed applications using official Android APIs.
 *
 * Supports at minimum:
 * - YouTube
 * - Facebook
 * - Camera
 * - Gallery/Photos
 * - Messages
 * - Phone
 * - Settings
 * - Chrome/Browser
 * - Play Store
 *
 * Also includes dynamic package discovery for apps like WhatsApp, Calculator, etc.
 * Never silently installs applications.
 */
class AppLauncher(private val context: Context) {

    sealed class LaunchResult {
        data class Success(val appName: String) : LaunchResult()
        data class AppNotInstalled(val appName: String) : LaunchResult()
        data class Error(val message: String) : LaunchResult()
    }

    data class StaticAppTarget(
        val nameBengali: String,
        val nameEnglish: String,
        val packageNames: List<String>,
        val explicitIntentAction: String? = null,
        val aliases: List<String>
    )

    private val staticTargets = listOf(
        StaticAppTarget(
            "YouTube", "YouTube",
            listOf("com.google.android.youtube"),
            aliases = listOf("ইউটিউব", "youtube", "utube", "yt", "ভিডিও")
        ),
        StaticAppTarget(
            "Facebook", "Facebook",
            listOf("com.facebook.katana", "com.facebook.lite"),
            aliases = listOf("ফেসবুক", "facebook", "fb")
        ),
        StaticAppTarget(
            "ক্যামেরা", "Camera",
            listOf("com.google.android.GoogleCamera", "com.android.camera"),
            explicitIntentAction = MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA,
            aliases = listOf("ক্যামেরা", "camera", "ছবি তোলো")
        ),
        StaticAppTarget(
            "গ্যালারি", "Gallery",
            listOf("com.google.android.apps.photos", "com.android.gallery3d", "com.sec.android.gallery3d"),
            explicitIntentAction = Intent.ACTION_VIEW,
            aliases = listOf("গ্যালারি", "gallery", "ছবি", "ফটো", "photos")
        ),
        StaticAppTarget(
            "মেসেজ", "Messages",
            listOf("com.google.android.apps.messaging", "com.android.mms"),
            explicitIntentAction = Intent.ACTION_MAIN,
            aliases = listOf("মেসেজ", "message", "বার্তা", "এসএমএস", "sms")
        ),
        StaticAppTarget(
            "ফোন", "Phone",
            listOf("com.google.android.dialer", "com.android.dialer"),
            explicitIntentAction = Intent.ACTION_DIAL,
            aliases = listOf("ফোন", "phone", "ডায়াল", "ডায়ালার", "dialer", "কল")
        ),
        StaticAppTarget(
            "সেটিংস", "Settings",
            listOf("com.android.settings"),
            explicitIntentAction = Settings.ACTION_SETTINGS,
            aliases = listOf("সেটিংস", "settings")
        ),
        StaticAppTarget(
            "ক্রোম ব্রাউজার", "Chrome",
            listOf("com.android.chrome"),
            explicitIntentAction = Intent.ACTION_MAIN,
            aliases = listOf("ক্রোম", "chrome", "ব্রাউজার", "browser", "ইন্টারনেট")
        ),
        StaticAppTarget(
            "গুগল প্লে স্টোর", "Play Store",
            listOf("com.android.vending"),
            aliases = listOf("প্লে স্টোর", "play store", "প্লেস্টোর", "playstore")
        )
    )

    fun launchApp(query: String): LaunchResult {
        val clean = query.lowercase().trim()

        // 1. Check known static apps
        for (target in staticTargets) {
            if (target.aliases.any { clean.contains(it.lowercase()) }) {
                return launchStaticTarget(target)
            }
        }

        // 2. Check dynamic launchable apps via PackageManager
        val pm = context.packageManager
        val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }

        val launchableApps = pm.queryIntentActivities(mainIntent, 0)
        for (resolveInfo in launchableApps) {
            val label = resolveInfo.loadLabel(pm).toString()
            val packageName = resolveInfo.activityInfo.packageName

            if (label.lowercase().contains(clean) || clean.contains(label.lowercase())) {
                val launchIntent = pm.getLaunchIntentForPackage(packageName)
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(launchIntent)
                    return LaunchResult.Success(label)
                }
            }
        }

        // App not found
        return LaunchResult.AppNotInstalled(query)
    }

    private fun launchStaticTarget(target: StaticAppTarget): LaunchResult {
        val pm = context.packageManager

        // Try direct packages
        for (pkg in target.packageNames) {
            val intent = pm.getLaunchIntentForPackage(pkg)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                return LaunchResult.Success(target.nameBengali)
            }
        }

        // Try explicit intent action if present
        if (target.explicitIntentAction != null) {
            try {
                val actionIntent = Intent(target.explicitIntentAction).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                if (actionIntent.resolveActivity(pm) != null) {
                    context.startActivity(actionIntent)
                    return LaunchResult.Success(target.nameBengali)
                }
            } catch (e: Exception) {
                Log.w("AppLauncher", "Intent action launch failed: \${e.message}")
            }
        }

        return LaunchResult.AppNotInstalled(target.nameBengali)
    }

    /**
     * Opens Play Store search page for an uninstalled app. Never automatically installs.
     */
    fun openPlayStoreSearch(appName: String): Boolean {
        return try {
            val marketIntent = Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=\${Uri.encode(appName)}")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(marketIntent)
            true
        } catch (e: Exception) {
            try {
                val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/search?q=\${Uri.encode(appName)}")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(webIntent)
                true
            } catch (err: Exception) {
                false
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/jannat/ai/JannatAccessibilityService.kt',
    name: 'JannatAccessibilityService.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.jannat.ai

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Build
import android.util.DisplayMetrics
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * JannatAccessibilityService handles official Android accessibility commands:
 * - GLOBAL_ACTION_BACK ("ব্যাক যাও", "পেছনে যাও")
 * - GLOBAL_ACTION_HOME ("হোমে যাও")
 * - GLOBAL_ACTION_LOCK_SCREEN ("ফোন লক করো") on Android 9+ (API 28)
 * - dispatchGesture for scrolling ("নিচে যাও", "নিচে স্ক্রল করো", "উপরে যাও", "উপরে স্ক্রল করো")
 *
 * Adheres strictly to Android security: never performs hidden or unauthorized actions.
 */
class JannatAccessibilityService : AccessibilityService() {

    companion object {
        @Volatile
        private var instance: JannatAccessibilityService? = null

        fun isServiceRunning(): Boolean = instance != null

        fun performAction(action: ScreenAction): Boolean {
            val service = instance ?: return false
            return when (action) {
                ScreenAction.BACK -> service.performGlobalAction(GLOBAL_ACTION_BACK)
                ScreenAction.HOME -> service.performGlobalAction(GLOBAL_ACTION_HOME)
                ScreenAction.LOCK_SCREEN -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        service.performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)
                    } else {
                        false
                    }
                }
                ScreenAction.SCROLL_DOWN -> service.performScrollGesture(isDown = true)
                ScreenAction.SCROLL_UP -> service.performScrollGesture(isDown = false)
            }
        }
    }

    enum class ScreenAction {
        BACK,
        HOME,
        LOCK_SCREEN,
        SCROLL_DOWN,
        SCROLL_UP
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i("JannatAccessibility", "Jannat Accessibility Service Connected.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Only responds to explicit user voice commands; does not snoop or monitor in background.
    }

    override fun onInterrupt() {
        Log.i("JannatAccessibility", "Jannat Accessibility Service Interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
    }

    /**
     * Performs a scroll using dispatchGesture with fallback to node scrolling.
     */
    private fun performScrollGesture(isDown: Boolean): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val displayMetrics: DisplayMetrics = resources.displayMetrics
            val width = displayMetrics.widthPixels.toFloat()
            val height = displayMetrics.heightPixels.toFloat()

            val startX = width / 2f
            val endX = width / 2f

            // For scrolling down: swipe up from 75% height to 25% height
            // For scrolling up: swipe down from 25% height to 75% height
            val startY = if (isDown) height * 0.75f else height * 0.25f
            val endY = if (isDown) height * 0.25f else height * 0.75f

            val swipePath = Path().apply {
                moveTo(startX, startY)
                lineTo(endX, endY)
            }

            val stroke = GestureDescription.StrokeDescription(swipePath, 0, 350)
            val gesture = GestureDescription.Builder().addStroke(stroke).build()

            val gestureDispatched = dispatchGesture(gesture, null, null)
            if (gestureDispatched) {
                return true
            }
        }

        // Fallback to accessibility node hierarchy scroll
        return performNodeScrollFallback(isDown)
    }

    private fun performNodeScrollFallback(isDown: Boolean): Boolean {
        val root = rootInActiveWindow ?: return false
        val action = if (isDown) AccessibilityNodeInfo.ACTION_SCROLL_FORWARD else AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
        val result = findAndScrollNode(root, action)
        root.recycle()
        return result
    }

    private fun findAndScrollNode(node: AccessibilityNodeInfo?, action: Int): Boolean {
        if (node == null) return false
        if (node.isScrollable && node.performAction(action)) {
            return true
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            if (child != null && findAndScrollNode(child, action)) {
                child.recycle()
                return true
            }
        }
        return false
    }
}`
  },
  {
    path: 'app/src/main/java/com/jannat/ai/DiagnosticsManager.kt',
    name: 'DiagnosticsManager.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.jannat.ai

import android.Manifest
import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import androidx.core.content.ContextCompat

/**
 * DiagnosticsManager safely checks device health and readiness.
 *
 * Checks:
 * - Internet connectivity
 * - Battery level & charging state
 * - Microphone permission
 * - Accessibility Service status
 * - Android version
 * - Available internal storage
 * - Memory / RAM health
 */
class DiagnosticsManager(private val context: Context) {

    enum class HealthStatus { GOOD, WARNING, ERROR }

    data class DiagnosticItem(
        val id: String,
        val title: String,
        val statusText: String,
        val detail: String,
        val health: HealthStatus
    )

    fun runDiagnostics(): List<DiagnosticItem> {
        return listOf(
            checkInternet(),
            checkBattery(),
            checkMicPermission(),
            checkAccessibilityService(),
            checkStorage(),
            checkRam(),
            checkAndroidVersion()
        )
    }

    fun getBengaliDiagnosticSummary(): String {
        val items = runDiagnostics()
        val issues = items.filter { it.health != HealthStatus.GOOD }

        val battery = items.find { it.id == "battery" }?.statusText ?: ""
        val net = items.find { it.id == "internet" }?.statusText ?: ""
        val storage = items.find { it.id == "storage" }?.statusText ?: ""

        return if (issues.isEmpty()) {
            "ফোন সম্পূর্ণ ঠিকঠাক আছে। ইন্টারনেট $net, ব্যাটারি $battery, এবং স্টোরেজ $storage।"
        } else {
            val issueTitles = issues.joinToString(", ") { it.title }
            "ফোনে কিছু বিষয় পরীক্ষা করা প্রয়োজন: $issueTitles। বিস্তারিত ডায়াগনস্টিকস স্ক্রিনে দেখে নিন।"
        }
    }

    private fun checkInternet(): DiagnosticItem {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        val network = cm?.activeNetwork
        val caps = cm?.getNetworkCapabilities(network)

        val hasInternet = caps != null && (
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        )

        return if (hasInternet) {
            val type = if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) "Wi-Fi" else "মোবাইল ডেটা"
            DiagnosticItem("internet", "ইন্টারনেট সংযোগ", "সচল ($type)", "ভয়েস কমান্ড ও ক্লাউড সংযোগ প্রস্তুত।", HealthStatus.GOOD)
        } else {
            DiagnosticItem("internet", "ইন্টারনেট সংযোগ", "বিচ্ছিন্ন", "অনলাইন ভয়েস সেবার জন্য ইন্টারনেট অন করুন।", HealthStatus.WARNING)
        }
    }

    private fun checkBattery(): DiagnosticItem {
        val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        val batteryStatus = context.registerReceiver(null, filter)

        val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: 100
        val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: 100
        val percent = ((level / scale.toFloat()) * 100).toInt()

        val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL

        val chargingText = if (isCharging) "চার্জ হচ্ছে" else "ব্যাটারিতে চলছে"

        return DiagnosticItem(
            "battery",
            "ব্যাটারি ও চার্জিং",
            "$percent% ($chargingText)",
            if (percent < 15 && !isCharging) "ব্যাটারি লেভেল কম, চার্জার যুক্ত করুন।" else "ব্যাটারি স্বাস্থ্য ভালো আছে।",
            if (percent < 15 && !isCharging) HealthStatus.WARNING else HealthStatus.GOOD
        )
    }

    private fun checkMicPermission(): DiagnosticItem {
        val granted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        return if (granted) {
            DiagnosticItem("mic", "মাইক্রোফোন অনুমতি", "অনুমোদিত", "ভয়েস কমান্ড শোনার জন্য মাইক্রোফোন সক্রিয়।", HealthStatus.GOOD)
        } else {
            DiagnosticItem("mic", "মাইক্রোফোন অনুমতি", "অনুমতি নেই", "ভয়েস নিয়ন্ত্রণের জন্য মাইক্রোফোন অনুমতি দিন।", HealthStatus.ERROR)
        }
    }

    private fun checkAccessibilityService(): DiagnosticItem {
        val running = JannatAccessibilityService.isServiceRunning()
        return if (running) {
            DiagnosticItem("accessibility", "Accessibility সার্ভিস", "সক্রিয়", "স্ক্রিন নেভিগেশন ও স্ক্রল প্রস্তুত।", HealthStatus.GOOD)
        } else {
            DiagnosticItem("accessibility", "Accessibility সার্ভিস", "বন্ধ রয়েছে", "ব্যাক, হোম, স্ক্রল ও লক নির্দেশের জন্য সার্ভিস চালু করুন।", HealthStatus.WARNING)
        }
    }

    private fun checkStorage(): DiagnosticItem {
        return try {
            val stat = StatFs(Environment.getDataDirectory().path)
            val freeBytes = stat.availableBlocksLong * stat.blockSizeLong
            val freeGb = freeBytes / (1024.0 * 1024.0 * 1024.0)

            DiagnosticItem(
                "storage",
                "ইন্টারনাল স্টোরেজ",
                "\${String.format(\"%.1f\", freeGb)} GB খালি",
                if (freeGb < 1.0) "স্টোরেজ প্রায় পূর্ণ, কিছু অপ্রয়োজনীয় ফাইল মুছুন।" else "পর্যাপ্ত ফাঁকা মেমরি রয়েছে।",
                if (freeGb < 1.0) HealthStatus.WARNING else HealthStatus.GOOD
            )
        } catch (e: Exception) {
            DiagnosticItem("storage", "ইন্টারনাল স্টোরেজ", "সাধারণ", "স্টোরেজ স্বাভাবিক আছে।", HealthStatus.GOOD)
        }
    }

    private fun checkRam(): DiagnosticItem {
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        am?.getMemoryInfo(memInfo)
        val freeMb = memInfo.availMem / (1024 * 1024)

        return DiagnosticItem(
            "ram",
            "র‍্যাম মেমরি (RAM)",
            "$freeMb MB খালি",
            if (memInfo.lowMemory) "র‍্যামের চাপ বেশি, ব্যাকগ্রাউন্ড অ্যাপস কমান।" else "র‍্যাম স্বাভাবিক অবস্থায় সচল।",
            if (memInfo.lowMemory) HealthStatus.WARNING else HealthStatus.GOOD
        )
    }

    private fun checkAndroidVersion(): DiagnosticItem {
        return DiagnosticItem(
            "os",
            "অ্যান্ড্রয়েড সংস্করণ",
            "Android \${Build.VERSION.RELEASE} (API \${Build.VERSION.SDK_INT})",
            "অ্যান্ড্রয়েড আর্কিটেকচার সামঞ্জস্যপূর্ণ।",
            HealthStatus.GOOD
        )
    }
}`
  },
  {
    path: 'app/src/main/java/com/jannat/ai/SafeRepairManager.kt',
    name: 'SafeRepairManager.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.jannat.ai

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.provider.Settings
import android.util.Log

/**
 * SafeRepairManager performs safe and official automatic repairs.
 *
 * Allowed safe operations:
 * - Reopen an application
 * - Clear Jannat's own temporary cache data
 * - Refresh network-related state
 * - Guide user to the correct Android settings page
 *
 * STRICT PROHIBITIONS:
 * - Never modifies protected system files
 * - Never roots the device
 * - Never bypasses security or passwords
 * - Never modifies another application's private data
 * - Never prevents app uninstallation
 */
class SafeRepairManager(private val context: Context) {

    fun clearJannatInternalCache(): Boolean {
        return try {
            val cacheDir = context.cacheDir
            if (cacheDir.isDirectory) {
                cacheDir.deleteRecursively()
                cacheDir.mkdirs()
            }
            true
        } catch (e: Exception) {
            Log.w("SafeRepair", "Error clearing cache: \${e.message}")
            false
        }
    }

    fun refreshNetworkState(): String {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        val network = cm?.activeNetwork
        return if (network != null) {
            "ইন্টারনেট সংযোগ সক্রিয় অবস্থায় রয়েছে।"
        } else {
            // Guide to official wireless settings
            try {
                val intent = Intent(Settings.ACTION_WIRELESS_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
                "ইন্টারনেট সংযোগ নেই। ওয়্যারলেস সেটিংস পেজ খোলা হয়েছে।"
            } catch (e: Exception) {
                "ইন্টারনেট বন্ধ রয়েছে। ফোনের সেটিংস থেকে Wi-Fi অথবা ডেটা চালু করুন।"
            }
        }
    }

    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}`
  },
  {
    path: 'app/src/main/java/com/jannat/ai/JannatSettings.kt',
    name: 'JannatSettings.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.jannat.ai

import android.content.Context
import android.content.SharedPreferences

/**
 * JannatSettings manages user preferences via SharedPreferences.
 */
class JannatSettings(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("jannat_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_VOICE_FEEDBACK = "key_voice_feedback"
        private const val KEY_SPEECH_RATE = "key_speech_rate"
        private const val KEY_SPEECH_PITCH = "key_speech_pitch"
        private const val KEY_SELECTED_VOICE = "key_selected_voice"
    }

    var isVoiceFeedbackEnabled: Boolean
        get() = prefs.getBoolean(KEY_VOICE_FEEDBACK, true)
        set(value) = prefs.edit().putBoolean(KEY_VOICE_FEEDBACK, value).apply()

    var speechRate: Float
        get() = prefs.getFloat(KEY_SPEECH_RATE, 1.0f)
        set(value) = prefs.edit().putFloat(KEY_SPEECH_RATE, value).apply()

    var speechPitch: Float
        get() = prefs.getFloat(KEY_SPEECH_PITCH, 1.15f) // Optimized for female timbre
        set(value) = prefs.edit().putFloat(KEY_SPEECH_PITCH, value).apply()

    var selectedVoiceName: String?
        get() = prefs.getString(KEY_SELECTED_VOICE, null)
        set(value) = prefs.edit().putString(KEY_SELECTED_VOICE, value).apply()
}`
  },
  {
    path: 'app/src/main/java/com/jannat/ai/DiagnosticsActivity.kt',
    name: 'DiagnosticsActivity.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.jannat.ai

import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.card.MaterialCardView

/**
 * DiagnosticsActivity displays phone health checks and permits safe maintenance.
 */
class DiagnosticsActivity : AppCompatActivity() {

    private lateinit var diagnosticsManager: DiagnosticsManager
    private lateinit var safeRepairManager: SafeRepairManager
    private lateinit var containerItems: LinearLayout
    private lateinit var tvDiagnosticsSummary: TextView
    private lateinit var btnClearCache: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_diagnostics)

        diagnosticsManager = DiagnosticsManager(this)
        safeRepairManager = SafeRepairManager(this)

        containerItems = findViewById(R.id.containerItems)
        tvDiagnosticsSummary = findViewById(R.id.tvDiagnosticsSummary)
        btnClearCache = findViewById(R.id.btnClearCache)

        btnClearCache.setOnClickListener {
            safeRepairManager.clearJannatInternalCache()
            loadDiagnostics()
        }

        loadDiagnostics()
    }

    private fun loadDiagnostics() {
        containerItems.removeAllViews()
        val items = diagnosticsManager.runDiagnostics()
        tvDiagnosticsSummary.text = diagnosticsManager.getBengaliDiagnosticSummary()

        for (item in items) {
            val card = MaterialCardView(this).apply {
                radius = 16f
                cardElevation = 2f
                setCardBackgroundColor(ContextCompat.getColor(this@DiagnosticsActivity, R.color.slate_card))
                strokeWidth = 1
                setStrokeColor(ContextCompat.getColor(this@DiagnosticsActivity, R.color.slate_border))
                val params = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, 0, 0, 16)
                }
                layoutParams = params
            }

            val layout = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(24, 20, 24, 20)
            }

            val titleView = TextView(this).apply {
                text = item.title
                textSize = 15f
                setTextColor(ContextCompat.getColor(this@DiagnosticsActivity, R.color.slate_title))
                typeface = android.graphics.Typeface.DEFAULT_BOLD
            }

            val statusView = TextView(this).apply {
                text = item.statusText
                textSize = 13f
                setTextColor(
                    when (item.health) {
                        DiagnosticsManager.HealthStatus.GOOD -> ContextCompat.getColor(this@DiagnosticsActivity, R.color.teal_primary)
                        DiagnosticsManager.HealthStatus.WARNING -> ContextCompat.getColor(this@DiagnosticsActivity, R.color.amber_accent)
                        DiagnosticsManager.HealthStatus.ERROR -> ContextCompat.getColor(this@DiagnosticsActivity, R.color.rose_accent)
                    }
                )
            }

            val detailView = TextView(this).apply {
                text = item.detail
                textSize = 12f
                setTextColor(ContextCompat.getColor(this@DiagnosticsActivity, R.color.slate_subtext))
            }

            layout.addView(titleView)
            layout.addView(statusView)
            layout.addView(detailView)
            card.addView(layout)
            containerItems.addView(card)
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/jannat/ai/SettingsActivity.kt',
    name: 'SettingsActivity.kt',
    category: 'kotlin',
    language: 'kotlin',
    content: `package com.jannat.ai

import android.os.Bundle
import android.widget.Button
import android.widget.SeekBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.switchmaterial.SwitchMaterial

/**
 * SettingsActivity permits configuration of female Bengali TTS voice, speech rate, and testing.
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var settings: JannatSettings
    private lateinit var voiceManager: VoiceCommandManager

    private lateinit var switchVoiceFeedback: SwitchMaterial
    private lateinit var seekSpeechRate: SeekBar
    private lateinit var tvSpeechRateVal: TextView
    private lateinit var seekSpeechPitch: SeekBar
    private lateinit var tvSpeechPitchVal: TextView
    private lateinit var btnTestVoice: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        settings = JannatSettings(this)
        voiceManager = VoiceCommandManager(this, object : VoiceCommandManager.VoiceListener {
            override fun onListeningStarted() {}
            override fun onListeningStopped() {}
            override fun onCommandReceived(rawCommand: String) {}
            override fun onVoiceError(errorMessage: String) {}
        }, settings)

        initViews()
    }

    private fun initViews() {
        switchVoiceFeedback = findViewById(R.id.switchVoiceFeedback)
        seekSpeechRate = findViewById(R.id.seekSpeechRate)
        tvSpeechRateVal = findViewById(R.id.tvSpeechRateVal)
        seekSpeechPitch = findViewById(R.id.seekSpeechPitch)
        tvSpeechPitchVal = findViewById(R.id.tvSpeechPitchVal)
        btnTestVoice = findViewById(R.id.btnTestVoice)

        switchVoiceFeedback.isChecked = settings.isVoiceFeedbackEnabled
        switchVoiceFeedback.setOnCheckedChangeListener { _, isChecked ->
            settings.isVoiceFeedbackEnabled = isChecked
        }

        val currentRateProgress = ((settings.speechRate - 0.7f) / 0.1f).toInt()
        seekSpeechRate.progress = currentRateProgress.coerceIn(0, 10)
        tvSpeechRateVal.text = String.format("%.1fx", settings.speechRate)

        seekSpeechRate.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                val rate = 0.7f + (progress * 0.1f)
                settings.speechRate = rate
                tvSpeechRateVal.text = String.format("%.1fx", rate)
                voiceManager.configureFemaleBengaliVoice()
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        val currentPitchProgress = ((settings.speechPitch - 0.8f) / 0.1f).toInt()
        seekSpeechPitch.progress = currentPitchProgress.coerceIn(0, 10)
        tvSpeechPitchVal.text = String.format("%.2f", settings.speechPitch)

        seekSpeechPitch.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                val pitch = 0.8f + (progress * 0.1f)
                settings.speechPitch = pitch
                tvSpeechPitchVal.text = String.format("%.2f", pitch)
                voiceManager.configureFemaleBengaliVoice()
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        btnTestVoice.setOnClickListener {
            voiceManager.speak("আসসালামু আলাইকুম, আমি জান্নাত। আমি আপনার নির্দেশ শুনতে প্রস্তুত।")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        voiceManager.destroy()
    }
}`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.jannat.ai">

    <!-- Official permissions required for Jannat AI Assistant -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES"
        tools:ignore="QueryAllPackagesPermission" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Jannat">

        <!-- Main Voice Assistant Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Diagnostics Activity -->
        <activity
            android:name=".DiagnosticsActivity"
            android:exported="false"
            android:label="@string/title_diagnostics"
            android:parentActivityName=".MainActivity" />

        <!-- Voice & App Settings Activity -->
        <activity
            android:name=".SettingsActivity"
            android:exported="false"
            android:label="@string/title_settings"
            android:parentActivityName=".MainActivity" />

        <!-- Official Accessibility Service for Screen Navigation & Gestures -->
        <service
            android:name=".JannatAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="false">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

    </application>
</manifest>`
  },
  {
    path: 'app/src/main/res/xml/accessibility_service_config.xml',
    name: 'accessibility_service_config.xml',
    category: 'xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_desc"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows"
    android:canPerformGestures="true"
    android:canRetrieveWindowContent="true"
    android:notificationTimeout="100" />`
  },
  {
    path: 'app/src/main/res/layout/activity_main.xml',
    name: 'activity_main.xml',
    category: 'xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@color/slate_background"
    android:padding="16dp">

    <!-- Top Header with JANNAT Title & Status Badges -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:id="@+id/tvAppTitle"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="JANNAT"
            android:textColor="@color/white"
            android:textSize="24sp"
            android:fontFamily="sans-serif-black"
            android:letterSpacing="0.05" />

        <TextView
            android:id="@+id/tvStatus"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/status_ready"
            android:textColor="@color/teal_primary"
            android:textSize="12sp"
            android:textStyle="bold"
            android:paddingHorizontal="8dp"
            android:paddingVertical="3dp"
            android:background="@drawable/bg_status_chip" />
    </LinearLayout>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:layout_marginTop="2dp">

        <TextView
            android:id="@+id/tvSubtitle"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="বাংলা ভয়েস অ্যাসিস্ট্যান্ট (Android)"
            android:textColor="@color/slate_subtext"
            android:textSize="11sp" />

        <!-- Live Voice / TTS Status Display -->
        <TextView
            android:id="@+id/tvTtsStatus"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/bn_voice_ready"
            android:textColor="@color/teal_primary"
            android:textSize="11sp"
            android:textStyle="bold" />
    </LinearLayout>

    <!-- Notice Banner for Preview/Emulator Notice -->
    <TextView
        android:id="@+id/tvLiveNotice"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="@drawable/bg_warning_box"
        android:textColor="@color/amber_accent"
        android:textSize="11sp"
        android:padding="8dp"
        android:layout_marginTop="8dp"
        android:text="@string/live_preview_notice" />

    <!-- Service Notice Banner if Accessibility is disabled -->
    <TextView
        android:id="@+id/tvServiceNotice"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="@drawable/bg_warning_box"
        android:textColor="@color/amber_accent"
        android:textSize="11sp"
        android:padding="8dp"
        android:layout_marginTop="6dp"
        android:visibility="gone" />

    <!-- Conversation Card -->
    <com.google.android.material.card.MaterialCardView
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:layout_marginVertical="12dp"
        app:cardBackgroundColor="@color/slate_card"
        app:strokeColor="@color/slate_border"
        app:strokeWidth="1dp"
        app:cardCornerRadius="18dp"
        app:cardElevation="2dp">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:orientation="vertical"
            android:padding="16dp"
            android:gravity="center">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="শনাক্তকৃত নির্দেশ (Recognized command):"
                android:textColor="@color/slate_subtext"
                android:textSize="11sp"
                android:fontFamily="sans-serif-medium" />

            <TextView
                android:id="@+id/tvRecognizedCommand"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="“ইউটিউব খোলো” অথবা “নিচে স্ক্রল করো” বলুন..."
                android:textColor="@color/white"
                android:textSize="15sp"
                android:textStyle="bold"
                android:gravity="center"
                android:layout_marginTop="4dp"
                android:layout_marginBottom="14dp" />

            <View
                android:layout_width="match_parent"
                android:layout_height="1dp"
                android:background="@color/slate_border"
                android:layout_marginBottom="14dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="জান্নাতের প্রতিক্রিয়া (Jannat response):"
                android:textColor="@color/teal_primary"
                android:textSize="11sp"
                android:fontFamily="sans-serif-medium" />

            <TextView
                android:id="@+id/tvJannatResponse"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="আসসালামু আলাইকুম! আমি জান্নাত। আপনাকে কীভাবে সাহায্য করতে পারি?"
                android:textColor="@color/slate_text_light"
                android:textSize="13sp"
                android:gravity="center"
                android:lineSpacingExtra="3dp"
                android:layout_marginTop="4dp" />
        </LinearLayout>
    </com.google.android.material.card.MaterialCardView>

    <!-- Center Microphone, Stop, and Test Voice Control -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center"
        android:layout_marginBottom="10dp">

        <com.google.android.material.floatingactionbutton.FloatingActionButton
            android:id="@+id/fabMic"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:contentDescription="Microphone"
            app:fabSize="normal"
            app:backgroundTint="@color/teal_primary"
            app:tint="@color/white"
            app:srcCompat="@android:drawable/ic_btn_speak_now" />

        <com.google.android.material.button.MaterialButton
            android:id="@+id/btnStop"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="থামান (Stop)"
            android:textColor="@color/slate_subtext"
            android:layout_marginStart="10dp"
            app:backgroundTint="@color/slate_card"
            app:strokeColor="@color/slate_border"
            app:strokeWidth="1dp"
            app:cornerRadius="12dp" />

        <!-- Dedicated "🔊 Test Voice" button -->
        <com.google.android.material.button.MaterialButton
            android:id="@+id/btnTestVoice"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/test_voice"
            android:textColor="@color/white"
            android:textSize="11sp"
            android:layout_marginStart="10dp"
            app:backgroundTint="@color/teal_dark"
            app:strokeColor="@color/teal_primary"
            app:strokeWidth="1dp"
            app:cornerRadius="12dp" />
    </LinearLayout>

    <!-- Bottom Action Buttons: Accessibility, Voice, Diagnostics, App Settings -->
    <GridLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:columnCount="2"
        android:rowCount="2"
        android:alignmentMode="alignMargins"
        android:useDefaultMargins="true">

        <com.google.android.material.button.MaterialButton
            android:id="@+id/btnAccessibilitySettings"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_columnWeight="1"
            android:text="Accessibility সেটিংস"
            android:textSize="11sp"
            android:textColor="@color/white"
            app:backgroundTint="@color/slate_card"
            app:strokeColor="@color/slate_border"
            app:strokeWidth="1dp"
            app:cornerRadius="12dp" />

        <com.google.android.material.button.MaterialButton
            android:id="@+id/btnVoiceSettings"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_columnWeight="1"
            android:text="ভয়েস (TTS) সেটিংস"
            android:textSize="11sp"
            android:textColor="@color/white"
            app:backgroundTint="@color/slate_card"
            app:strokeColor="@color/slate_border"
            app:strokeWidth="1dp"
            app:cornerRadius="12dp" />

        <com.google.android.material.button.MaterialButton
            android:id="@+id/btnDiagnostics"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_columnWeight="1"
            android:text="ফোন ডায়াগনস্টিকস"
            android:textSize="11sp"
            android:textColor="@color/white"
            app:backgroundTint="@color/slate_card"
            app:strokeColor="@color/slate_border"
            app:strokeWidth="1dp"
            app:cornerRadius="12dp" />

        <com.google.android.material.button.MaterialButton
            android:id="@+id/btnAppSettings"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_columnWeight="1"
            android:text="অ্যাপ সেটিংস"
            android:textSize="11sp"
            android:textColor="@color/white"
            app:backgroundTint="@color/slate_card"
            app:strokeColor="@color/slate_border"
            app:strokeWidth="1dp"
            app:cornerRadius="12dp" />
    </GridLayout>

</LinearLayout>`
  },
  {
    path: 'app/src/main/res/layout/activity_diagnostics.xml',
    name: 'activity_diagnostics.xml',
    category: 'xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@color/slate_background"
    android:padding="16dp">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="ফোন ডায়াগনস্টিকস ও নিরাপত্তা"
        android:textColor="@color/white"
        android:textSize="20sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/tvDiagnosticsSummary"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textColor="@color/teal_primary"
        android:textSize="13sp"
        android:padding="12dp"
        android:background="@drawable/bg_status_chip"
        android:layout_marginVertical="12dp" />

    <Button
        android:id="@+id/btnClearCache"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="ক্যাশ ফাইল পরিষ্কার করুন (Safe Cache Clean)"
        android:backgroundTint="@color/slate_card"
        android:textColor="@color/white"
        android:layout_marginBottom="12dp" />

    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1">

        <LinearLayout
            android:id="@+id/containerItems"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical" />
    </ScrollView>
</LinearLayout>`
  },
  {
    path: 'app/src/main/res/layout/activity_settings.xml',
    name: 'activity_settings.xml',
    category: 'xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/slate_background"
    android:padding="16dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="জান্নাত ভয়েস সেটিংস"
            android:textColor="@color/white"
            android:textSize="20sp"
            android:textStyle="bold"
            android:layout_marginBottom="16dp" />

        <!-- Voice Feedback Toggle -->
        <com.google.android.material.card.MaterialCardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="12dp"
            app:cardBackgroundColor="@color/slate_card"
            app:strokeColor="@color/slate_border"
            app:strokeWidth="1dp"
            app:cardCornerRadius="16dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:padding="16dp">

                <LinearLayout
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:orientation="vertical">

                    <TextView
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="মহিলা বাংলা ভয়েস ফিডব্যাক"
                        android:textColor="@color/white"
                        android:textSize="14sp"
                        android:textStyle="bold" />

                    <TextView
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="কমান্ড সম্পন্ন হলে জান্নাত বাংলায় কথা বলে জানাবে।"
                        android:textColor="@color/slate_subtext"
                        android:textSize="11sp" />
                </LinearLayout>

                <com.google.android.material.switchmaterial.SwitchMaterial
                    android:id="@+id/switchVoiceFeedback"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content" />
            </LinearLayout>
        </com.google.android.material.card.MaterialCardView>

        <!-- Speech Rate Slider -->
        <com.google.android.material.card.MaterialCardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="12dp"
            app:cardBackgroundColor="@color/slate_card"
            app:strokeColor="@color/slate_border"
            app:strokeWidth="1dp"
            app:cardCornerRadius="16dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="horizontal">

                    <TextView
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:layout_weight="1"
                        android:text="কথা বলার গতি (Speed)"
                        android:textColor="@color/white"
                        android:textSize="14sp"
                        android:textStyle="bold" />

                    <TextView
                        android:id="@+id/tvSpeechRateVal"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="1.0x"
                        android:textColor="@color/teal_primary"
                        android:textSize="13sp" />
                </LinearLayout>

                <SeekBar
                    android:id="@+id/seekSpeechRate"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:max="10"
                    android:layout_marginTop="8dp" />
            </LinearLayout>
        </com.google.android.material.card.MaterialCardView>

        <!-- Speech Pitch Slider -->
        <com.google.android.material.card.MaterialCardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="16dp"
            app:cardBackgroundColor="@color/slate_card"
            app:strokeColor="@color/slate_border"
            app:strokeWidth="1dp"
            app:cardCornerRadius="16dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="horizontal">

                    <TextView
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:layout_weight="1"
                        android:text="কণ্ঠের সুর (Female Timbre / Pitch)"
                        android:textColor="@color/white"
                        android:textSize="14sp"
                        android:textStyle="bold" />

                    <TextView
                        android:id="@+id/tvSpeechPitchVal"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="1.15"
                        android:textColor="@color/teal_primary"
                        android:textSize="13sp" />
                </LinearLayout>

                <SeekBar
                    android:id="@+id/seekSpeechPitch"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:max="10"
                    android:layout_marginTop="8dp" />
            </LinearLayout>
        </com.google.android.material.card.MaterialCardView>

        <!-- Voice Test Button -->
        <com.google.android.material.button.MaterialButton
            android:id="@+id/btnTestVoice"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="ভয়েস পরীক্ষা করুন (Test Voice)"
            android:textColor="@color/white"
            app:backgroundTint="@color/teal_primary"
            app:cornerRadius="12dp"
            android:padding="12dp"
            android:layout_marginBottom="16dp" />

        <!-- Normal Uninstall Information Card -->
        <com.google.android.material.card.MaterialCardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            app:cardBackgroundColor="@color/slate_card"
            app:strokeColor="@color/slate_border"
            app:strokeWidth="1dp"
            app:cardCornerRadius="16dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="সহজ আনইনস্টল সুবিধা (Normal Uninstall)"
                    android:textColor="@color/white"
                    android:textSize="13sp"
                    android:textStyle="bold" />

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="জান্নাত একটি স্বাভাবিক অ্যান্ড্রয়েড অ্যাপ। আপনি ফোনের সেটিংস > অ্যাপস > Jannat থেকে যেকোনো সময় স্বাভাবিকভাবে এটি আনইনস্টল অথবা বন্ধ করতে পারেন।"
                    android:textColor="@color/slate_subtext"
                    android:textSize="11sp"
                    android:layout_marginTop="4dp"
                    android:lineSpacingExtra="2dp" />
            </LinearLayout>
        </com.google.android.material.card.MaterialCardView>

    </LinearLayout>
</ScrollView>`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    name: 'strings.xml',
    category: 'xml',
    language: 'xml',
    content: `<resources>
    <string name="app_name">Jannat</string>
    <string name="accessibility_service_desc">জান্নাত এআই অ্যাসিস্ট্যান্টকে ভয়েস নির্দেশে স্ক্রিন ব্যাক, হোম, স্ক্রল এবং স্ক্রিন লক করতে সহায়তা করে।</string>
    <string name="title_diagnostics">ফোন ডায়াগনস্টিকস</string>
    <string name="title_settings">ভয়েস সেটিংস</string>
    <string name="status_ready">Ready (প্রস্তুত)</string>
    <string name="status_listening">Listening (শুনছি...)</string>
    <string name="status_processing">Processing (প্রক্রিয়াধীন...)</string>
    <string name="status_error">ত্রুটি ঘটেছে</string>
    <string name="test_voice">🔊 Test Voice (ভয়েস পরীক্ষা)</string>
    <string name="tts_initializing">TTS চালু হচ্ছে...</string>
    <string name="tts_ready">TTS প্রস্তুত</string>
    <string name="bn_voice_ready">বাংলা ভয়েস প্রস্তুত</string>
    <string name="tts_error">TTS error</string>
    <string name="bn_voice_not_found">বাংলা ভয়েস পাওয়া যায়নি</string>
    <string name="voice_not_ready_yet">ভয়েস এখনো প্রস্তুত হচ্ছে।</string>
    <string name="test_voice_sample">হ্যালো, আমি জন্নাত। আমি তোমার কথা শুনতে প্রস্তুত।</string>
    <string name="live_preview_notice">Live Preview-তে native Android voice পরীক্ষা করা যাচ্ছে না। APK/Android emulator-এ পরীক্ষা করুন।</string>
</resources>`
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    name: 'colors.xml',
    category: 'xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="teal_primary">#0D9488</color>
    <color name="teal_dark">#0F766E</color>
    <color name="rose_accent">#E11D48</color>
    <color name="amber_accent">#F59E0B</color>
    <color name="slate_background">#020617</color>
    <color name="slate_card">#0F172A</color>
    <color name="slate_border">#1E293B</color>
    <color name="slate_title">#F8FAFC</color>
    <color name="slate_text_light">#E2E8F0</color>
    <color name="slate_subtext">#94A3B8</color>
    <color name="white">#FFFFFF</color>
</resources>`
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    name: 'themes.xml',
    category: 'xml',
    language: 'xml',
    content: `<resources>
    <style name="Theme.Jannat" parent="Theme.Material3.Dark.NoActionBar">
        <item name="colorPrimary">@color/teal_primary</color>
        <item name="colorSecondary">@color/teal_dark</item>
        <item name="android:statusBarColor">@color/slate_background</item>
        <item name="android:navigationBarColor">@color/slate_background</item>
    </style>
</resources>`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    category: 'gradle',
    language: 'kotlin',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.jannat.ai"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.jannat.ai"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.activity:activity-ktx:1.9.0")
}`
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts',
    category: 'gradle',
    language: 'kotlin',
    content: `plugins {
    id("com.android.application") version "8.4.1" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}`
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    category: 'gradle',
    language: 'kotlin',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Jannat"
include(":app")`
  },
  {
    path: 'gradle.properties',
    name: 'gradle.properties',
    category: 'gradle',
    language: 'kotlin',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`
  }
];
