package com.jannat.ai

import android.content.Context
import android.content.SharedPreferences

/**
 * JannatSettings manages app preferences and configuration via SharedPreferences.
 */
class JannatSettings(context: Context) {

    companion object {
        private const val PREFS_NAME = "jannat_ai_prefs"
        private const val KEY_VOICE_FEEDBACK = "key_voice_feedback"
        private const val KEY_FRIENDLY_CHECKINS = "key_friendly_checkins"
        private const val KEY_SPEECH_RATE = "key_speech_rate"
        private const val KEY_LANGUAGE_LOCALE = "key_language_locale"
        private const val KEY_AUTO_LISTEN = "key_auto_listen"
    }

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var isVoiceFeedbackEnabled: Boolean
        get() = prefs.getBoolean(KEY_VOICE_FEEDBACK, true)
        set(value) = prefs.edit().putBoolean(KEY_VOICE_FEEDBACK, value).apply()

    var isFriendlyCheckinsEnabled: Boolean
        get() = prefs.getBoolean(KEY_FRIENDLY_CHECKINS, true)
        set(value) = prefs.edit().putBoolean(KEY_FRIENDLY_CHECKINS, value).apply()

    var speechRate: Float
        get() = prefs.getFloat(KEY_SPEECH_RATE, 1.0f)
        set(value) = prefs.edit().putFloat(KEY_SPEECH_RATE, value).apply()

    var preferredLanguage: String
        get() = prefs.getString(KEY_LANGUAGE_LOCALE, "bn-BD") ?: "bn-BD"
        set(value) = prefs.edit().putString(KEY_LANGUAGE_LOCALE, value).apply()

    var isAutoListenEnabled: Boolean
        get() = prefs.getBoolean(KEY_AUTO_LISTEN, false)
        set(value) = prefs.edit().putBoolean(KEY_AUTO_LISTEN, value).apply()

    /**
     * Resets settings back to safe defaults.
     */
    fun resetToDefaults() {
        prefs.edit().clear().apply()
    }
}
