package com.jannat.ai

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.floatingactionbutton.FloatingActionButton

/**
 * MainActivity is the primary visual interface for Jannat AI Bengali voice assistant.
 */
class MainActivity : AppCompatActivity(), VoiceCommandManager.VoiceListener {

    private lateinit var appLauncher: AppLauncher
    private lateinit var commandProcessor: CommandProcessor
    private lateinit var voiceCommandManager: VoiceCommandManager
    private lateinit var diagnosticsManager: DiagnosticsManager
    private lateinit var jannatSettings: JannatSettings

    // UI View References
    private lateinit var tvAssistantStatus: TextView
    private lateinit var tvCurrentCommand: TextView
    private lateinit var tvAssistantReply: TextView
    private lateinit var tvMicActionHint: TextView
    private lateinit var fabMic: FloatingActionButton

    private lateinit var cardMicStatus: MaterialCardView
    private lateinit var indicatorMic: View
    private lateinit var tvMicStatus: TextView

    private lateinit var cardAccessStatus: MaterialCardView
    private lateinit var indicatorAccess: View
    private lateinit var tvAccessStatus: TextView

    private lateinit var btnEnableAccessibility: MaterialButton
    private lateinit var btnNavDiagnostics: MaterialButton
    private lateinit var btnNavSettings: MaterialButton

    private var isListening = false

    // Modern Android Permission Request Contract
    private val requestRecordAudioLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        updateStatusIndicators()
        if (isGranted) {
            startListeningInternal()
        } else {
            Toast.makeText(
                this,
                getString(R.string.msg_mic_permission_required),
                Toast.LENGTH_LONG
            ).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize Core Components
        appLauncher = AppLauncher(this)
        commandProcessor = CommandProcessor(appLauncher)
        diagnosticsManager = DiagnosticsManager(this)
        jannatSettings = JannatSettings(this)
        voiceCommandManager = VoiceCommandManager(this, this)

        initViews()
        setupListeners()
    }

    private fun initViews() {
        tvAssistantStatus = findViewById(R.id.tvAssistantStatus)
        tvCurrentCommand = findViewById(R.id.tvCurrentCommand)
        tvAssistantReply = findViewById(R.id.tvAssistantReply)
        tvMicActionHint = findViewById(R.id.tvMicActionHint)
        fabMic = findViewById(R.id.fabMic)

        cardMicStatus = findViewById(R.id.cardMicStatus)
        indicatorMic = findViewById(R.id.indicatorMic)
        tvMicStatus = findViewById(R.id.tvMicStatus)

        cardAccessStatus = findViewById(R.id.cardAccessStatus)
        indicatorAccess = findViewById(R.id.indicatorAccess)
        tvAccessStatus = findViewById(R.id.tvAccessStatus)

        btnEnableAccessibility = findViewById(R.id.btnEnableAccessibility)
        btnNavDiagnostics = findViewById(R.id.btnNavDiagnostics)
        btnNavSettings = findViewById(R.id.btnNavSettings)
    }

    private fun setupListeners() {
        // Microphone FAB Toggle
        fabMic.setOnClickListener {
            toggleMicrophoneListening()
        }

        // Accessibility Enabler Button
        btnEnableAccessibility.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
        }

        // Diagnostics Navigation
        btnNavDiagnostics.setOnClickListener {
            startActivity(Intent(this, DiagnosticsActivity::class.java))
        }

        // Settings Navigation
        btnNavSettings.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        updateStatusIndicators()
    }

    private fun updateStatusIndicators() {
        // Check Microphone Permission
        val hasMicPermission = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (hasMicPermission) {
            indicatorMic.setBackgroundResource(R.drawable.circle_indicator)
            tvMicStatus.text = getString(R.string.chip_mic_ok)
            tvMicStatus.setTextColor(ContextCompat.getColor(this, R.color.on_surface))
        } else {
            tvMicStatus.text = getString(R.string.chip_mic_missing)
            tvMicStatus.setTextColor(ContextCompat.getColor(this, R.color.error))
        }

        // Check Accessibility Service
        val isAccessRunning = JannatAccessibilityService.isServiceRunning()
        if (isAccessRunning) {
            indicatorAccess.setBackgroundResource(R.drawable.circle_indicator)
            tvAccessStatus.text = getString(R.string.chip_access_ok)
            tvAccessStatus.setTextColor(ContextCompat.getColor(this, R.color.on_surface))
            btnEnableAccessibility.visibility = View.GONE
        } else {
            tvAccessStatus.text = getString(R.string.chip_access_missing)
            tvAccessStatus.setTextColor(ContextCompat.getColor(this, R.color.warning))
            btnEnableAccessibility.visibility = View.VISIBLE
        }
    }

    private fun toggleMicrophoneListening() {
        if (isListening) {
            voiceCommandManager.stopListening()
        } else {
            val hasMicPermission = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED

            if (hasMicPermission) {
                startListeningInternal()
            } else {
                requestRecordAudioLauncher.launch(Manifest.permission.RECORD_AUDIO)
            }
        }
    }

    private fun startListeningInternal() {
        voiceCommandManager.startListening()
        tvAssistantStatus.text = getString(R.string.status_listening)
        tvAssistantStatus.setTextColor(ContextCompat.getColor(this, R.color.primary))
        tvCurrentCommand.text = "বলুন, আমি শুনছি..."
    }

    // VoiceCommandManager Callbacks
    override fun onListeningStateChanged(isListening: Boolean) {
        this.isListening = isListening
        if (isListening) {
            fabMic.backgroundTintList = ContextCompat.getColorStateList(this, R.color.error)
            tvMicActionHint.text = getString(R.string.btn_mic_stop)
            tvAssistantStatus.text = getString(R.string.status_listening)
        } else {
            fabMic.backgroundTintList = ContextCompat.getColorStateList(this, R.color.primary)
            tvMicActionHint.text = getString(R.string.btn_mic_talk)
            tvAssistantStatus.text = getString(R.string.status_ready)
        }
    }

    override fun onCommandReceived(rawCommand: String) {
        tvCurrentCommand.text = "“$rawCommand”"
        tvAssistantStatus.text = getString(R.string.status_processing)

        // Process Command via CommandProcessor
        val result = commandProcessor.processCommand(rawCommand)

        tvAssistantReply.text = result.feedbackMessage
        tvAssistantStatus.text = if (result.isSuccess) "সম্পন্ন" else "মনোযোগ দিন"

        // Voice Feedback via TTS if enabled
        if (jannatSettings.isVoiceFeedbackEnabled) {
            voiceCommandManager.speak(result.feedbackMessage)
        }
    }

    override fun onVoiceError(errorMessage: String) {
        tvAssistantStatus.text = errorMessage
        tvAssistantStatus.setTextColor(ContextCompat.getColor(this, R.color.warning))
    }

    override fun onDestroy() {
        super.onDestroy()
        voiceCommandManager.destroy()
    }
}
