package com.jannat.ai

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.switchmaterial.SwitchMaterial

/**
 * SettingsActivity allows configuring Jannat AI behavior, voice feedback,
 * accessibility guidance, and standard Android uninstall navigation.
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var settings: JannatSettings

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        settings = JannatSettings(this)

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbarSettings)
        toolbar.setNavigationOnClickListener {
            finish()
        }

        val switchVoiceFeedback = findViewById<SwitchMaterial>(R.id.switchVoiceFeedback)
        val switchFriendlyCheckins = findViewById<SwitchMaterial>(R.id.switchFriendlyCheckins)
        val btnOpenAccessibility = findViewById<MaterialButton>(R.id.btnOpenAccessibilitySettings)
        val btnOpenAppDetails = findViewById<MaterialButton>(R.id.btnOpenAppDetails)

        switchVoiceFeedback.isChecked = settings.isVoiceFeedbackEnabled
        switchVoiceFeedback.setOnCheckedChangeListener { _, isChecked ->
            settings.isVoiceFeedbackEnabled = isChecked
        }

        switchFriendlyCheckins.isChecked = settings.isFriendlyCheckinsEnabled
        switchFriendlyCheckins.setOnCheckedChangeListener { _, isChecked ->
            settings.isFriendlyCheckinsEnabled = isChecked
        }

        btnOpenAccessibility.setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }

        btnOpenAppDetails.setOnClickListener {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", packageName, null)
            }
            startActivity(intent)
        }
    }
}
