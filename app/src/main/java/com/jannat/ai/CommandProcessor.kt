package com.jannat.ai

import android.util.Log

/**
 * CommandProcessor processes natural Bengali & English voice commands and executes actions.
 *
 * MAPPINGS:
 * - "ইউটিউব খোলো" / "open youtube" -> AppLauncher.launchAppByName("youtube")
 * - "ফেসবুক খোলো" / "open facebook" -> AppLauncher.launchAppByName("facebook")
 * - "নিচে স্ক্রল করো" / "scroll down" -> AccessibilityService.scrollDown()
 * - "উপরে স্ক্রল করো" / "উপরে যাও" / "scroll up" -> AccessibilityService.scrollUp()
 * - "পিছনে যাও" / "back" -> GLOBAL_ACTION_BACK
 * - "হোমে যাও" / "home" -> GLOBAL_ACTION_HOME
 * - "ফোন লক করো" / "lock phone" -> GLOBAL_ACTION_LOCK_SCREEN
 * - Conversational check-ins and respectful replies
 */
class CommandProcessor(
    private val appLauncher: AppLauncher
) {

    companion object {
        private const val TAG = "CommandProcessor"
    }

    data class CommandResult(
        val type: CommandType,
        val feedbackMessage: String,
        val isSuccess: Boolean
    )

    enum class CommandType {
        APP_LAUNCH,
        SCREEN_BACK,
        SCREEN_HOME,
        SCREEN_LOCK,
        SCROLL_DOWN,
        SCROLL_UP,
        CONVERSATION,
        UNKNOWN
    }

    /**
     * Parses the incoming voice command text and routes it to the corresponding service.
     */
    fun processCommand(rawInput: String): CommandResult {
        val input = rawInput.trim().lowercase()
        Log.d(TAG, "Processing incoming command: '$input'")

        // Remove trigger word prefix "জান্নাত" or "jannat" if present
        val cleanInput = input
            .replace("জান্নাত,", "")
            .replace("জান্নাত", "")
            .replace("jannat,", "")
            .replace("jannat", "")
            .trim()

        // 1. YouTube Launching
        if (cleanInput.contains("ইউটিউব খোলো") ||
            cleanInput.contains("ইউটিউব ওপেন করো") ||
            cleanInput.contains("open youtube") ||
            cleanInput.contains("launch youtube")
        ) {
            return handleAppLaunch("ইউটিউব", "YouTube")
        }

        // 2. Facebook Launching
        if (cleanInput.contains("ফেসবুক খোলো") ||
            cleanInput.contains("ফেসবুক ওপেন করো") ||
            cleanInput.contains("open facebook") ||
            cleanInput.contains("launch facebook")
        ) {
            return handleAppLaunch("ফেসবুক", "Facebook")
        }

        // 3. Generic App Launch ("... খোলো" / "open ...")
        if (cleanInput.contains("খোলো") || cleanInput.contains("ওপেন করো") || cleanInput.startsWith("open ") || cleanInput.startsWith("launch ")) {
            val appQuery = cleanInput
                .replace("খোলো", "")
                .replace("ওপেন করো", "")
                .replace("অ্যাপ", "")
                .replace("open ", "")
                .replace("launch ", "")
                .trim()

            if (appQuery.isNotEmpty()) {
                return handleAppLaunch(appQuery, appQuery)
            }
        }

        // 4. Scroll Down ("নিচে স্ক্রল করো" / "scroll down")
        if (cleanInput.contains("নিচে স্ক্রল করো") ||
            cleanInput.contains("নিচে যাও") ||
            cleanInput.contains("স্ক্রল ডাউন") ||
            cleanInput.contains("scroll down") ||
            cleanInput.contains("page down")
        ) {
            return executeAccessibilityAction(
                JannatAccessibilityService.ScreenAction.SCROLL_DOWN,
                CommandType.SCROLL_DOWN,
                "নিচে স্ক্রল করা হয়েছে।"
            )
        }

        // 5. Scroll Up ("উপরে স্ক্রল করো" / "উপরে যাও" / "scroll up")
        if (cleanInput.contains("উপরে স্ক্রল করো") ||
            cleanInput.contains("উপরে যাও") ||
            cleanInput.contains("স্ক্রল আপ") ||
            cleanInput.contains("scroll up") ||
            cleanInput.contains("page up")
        ) {
            return executeAccessibilityAction(
                JannatAccessibilityService.ScreenAction.SCROLL_UP,
                CommandType.SCROLL_UP,
                "উপরে স্ক্রল করা হয়েছে।"
            )
        }

        // 6. Go Back ("পিছনে যাও" / "back")
        if (cleanInput.contains("পিছনে যাও") ||
            cleanInput.contains("ব্যাক করো") ||
            cleanInput.contains("পিছে যাও") ||
            cleanInput.contains("go back") ||
            cleanInput == "back"
        ) {
            return executeAccessibilityAction(
                JannatAccessibilityService.ScreenAction.BACK,
                CommandType.SCREEN_BACK,
                "পূর্ববর্তী স্ক্রিনে ফিরে যাওয়া হয়েছে।"
            )
        }

        // 7. Go Home ("হোমে যাও" / "home")
        if (cleanInput.contains("হোমে যাও") ||
            cleanInput.contains("হোম স্ক্রিনে যাও") ||
            cleanInput.contains("go home") ||
            cleanInput == "home"
        ) {
            return executeAccessibilityAction(
                JannatAccessibilityService.ScreenAction.HOME,
                CommandType.SCREEN_HOME,
                "হোম স্ক্রিনে যাওয়া হয়েছে।"
            )
        }

        // 8. Lock Phone ("ফোন লক করো" / "lock phone")
        if (cleanInput.contains("ফোন লক করো") ||
            cleanInput.contains("স্ক্রিন লক করো") ||
            cleanInput.contains("লক করো") ||
            cleanInput.contains("lock phone") ||
            cleanInput.contains("lock screen")
        ) {
            return executeAccessibilityAction(
                JannatAccessibilityService.ScreenAction.LOCK_SCREEN,
                CommandType.SCREEN_LOCK,
                "ফোন লক করা হচ্ছে।"
            )
        }

        // 9. Natural Friendly Bengali Conversation Check-ins & Q&A
        val conversationResponse = checkConversationalPhrases(cleanInput)
        if (conversationResponse != null) {
            return CommandResult(
                type = CommandType.CONVERSATION,
                feedbackMessage = conversationResponse,
                isSuccess = true
            )
        }

        // 10. Fallback for Unrecognized Command
        return CommandResult(
            type = CommandType.UNKNOWN,
            feedbackMessage = "দুঃখিত, এই নির্দেশটি বুঝতে পারিনি। আপনি “ইউটিউব খোলো”, “নিচে স্ক্রল করো”, অথবা “হোমে যাও” বলতে পারেন।",
            isSuccess = false
        )
    }

    private fun handleAppLaunch(appNameBn: String, appNameEn: String): CommandResult {
        when (val result = appLauncher.launchAppByName(appNameBn)) {
            is AppLauncher.LaunchResult.Success -> {
                return CommandResult(
                    type = CommandType.APP_LAUNCH,
                    feedbackMessage = "${result.appName} চালু করা হচ্ছে...",
                    isSuccess = true
                )
            }
            is AppLauncher.LaunchResult.AppNotInstalled -> {
                return CommandResult(
                    type = CommandType.APP_LAUNCH,
                    feedbackMessage = "দুঃখিত, ${result.appName} আপনার ফোনে ইনস্টল করা নেই।",
                    isSuccess = false
                )
            }
            is AppLauncher.LaunchResult.UnknownApp -> {
                return CommandResult(
                    type = CommandType.APP_LAUNCH,
                    feedbackMessage = "“$appNameBn” নামের কোনো অ্যাপ্লিকেশন খুঁজে পাওয়া যায়নি।",
                    isSuccess = false
                )
            }
            is AppLauncher.LaunchResult.Error -> {
                return CommandResult(
                    type = CommandType.APP_LAUNCH,
                    feedbackMessage = "অ্যাপ চালু করার সময় ত্রুটি ঘটেছে: ${result.message}",
                    isSuccess = false
                )
            }
        }
    }

    private fun executeAccessibilityAction(
        action: JannatAccessibilityService.ScreenAction,
        type: CommandType,
        successMessage: String
    ): CommandResult {
        if (!JannatAccessibilityService.isServiceRunning()) {
            return CommandResult(
                type = type,
                feedbackMessage = "এই কাজটি করতে Accessibility সার্ভিস সক্রিয় করা প্রয়োজন। অনুগ্রহ করে সেটিংস থেকে Accessibility চালু করুন।",
                isSuccess = false
            )
        }

        val success = JannatAccessibilityService.performAction(action)
        return if (success) {
            CommandResult(type, successMessage, true)
        } else {
            CommandResult(type, "স্ক্রিন একশনটি সম্পন্ন করা সম্ভব হয়নি।", false)
        }
    }

    /**
     * Friendly, respectful Bengali conversation logic.
     * Note: Respectful and friendly, NEVER romantic or spouse/partner.
     */
    private fun checkConversationalPhrases(input: String): String? {
        return when {
            input.contains("কেমন আছো") || input.contains("কেমন আছেন") || input.contains("how are you") -> {
                "আলহামদুলিল্লাহ, আমি ভালো আছি। আপনি কেমন আছেন? আজকের দিনটা কেমন যাচ্ছে?"
            }
            input.contains("খাওয়া") || input.contains("খাওয়াদাওয়া") || input.contains("খাইছো") || input.contains("ভাত খাইছো") -> {
                "আমি তো একটি ভার্চুয়াল অ্যাসিস্ট্যান্ট, আমার খাবারের প্রয়োজন হয় না। তবে আপনি সময়মতো ঠিকঠাক খাওয়াদাওয়া করেছেন তো?"
            }
            input.contains("কী করছো") || input.contains("কি করছো") || input.contains("what are you doing") -> {
                "আমি আপনার নির্দেশের অপেক্ষায় প্রস্তুত রয়েছি। কোনো কাজ থাকলে নির্দ্বিধায় বলুন!"
            }
            input.contains("সব ঠিকঠাক") || input.contains("সব ঠিক আছে") -> {
                "হ্যাঁ, সবকিছু একদম ঠিকঠাক চলছে। আপনার কাজকর্মে কোনো সাহায্য প্রয়োজন হলে বলুন।"
            }
            input.contains("ধন্যবাদ") || input.contains("থ্যাংকস") || input.contains("thank you") -> {
                "আপনাকেও অনেক ধন্যবাদ! আপনার কাজে আসতে পেরে আমি আনন্দিত।"
            }
            input.contains("তোমার নাম কি") || input.contains("who are you") || input.contains("তুমি কে") -> {
                "আমি জান্নাত এআই, আপনার বাংলা ভয়েস কন্ট্রোলড অ্যান্ড্রয়েড অ্যাসিস্ট্যান্ট।"
            }
            input.contains("সালাম") || input.contains("আসসালামু আলাইকুম") || input.contains("hello") || input.contains("হাই") -> {
                "ওয়ালাইকুম আসসালাম! জান্নাত এআই প্রস্তুত। আপনাকে কীভাবে সহায়তা করতে পারি?"
            }
            else -> null
        }
    }
}
