package com.jannat.ai

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log

/**
 * AppLauncher provides an extensible application launching architecture.
 *
 * It maps spoken application names (Bengali and English) to Android package identifiers,
 * queries installed apps, and gracefully notifies the user if an application is missing.
 */
class AppLauncher(private val context: Context) {

    companion object {
        private const val TAG = "AppLauncher"
    }

    data class AppTarget(
        val displayNameBengali: String,
        val displayNameEnglish: String,
        val packageNames: List<String>,
        val spokenAliases: List<String>
    )

    // Extensible App Registry
    private val appRegistry = mutableListOf<AppTarget>()

    init {
        registerDefaultApps()
    }

    private fun registerDefaultApps() {
        // 1. YouTube
        registerApp(
            AppTarget(
                displayNameBengali = "ইউটিউব",
                displayNameEnglish = "YouTube",
                packageNames = listOf("com.google.android.youtube"),
                spokenAliases = listOf("ইউটিউব", "youtube", "utube", "yt")
            )
        )

        // 2. Facebook
        registerApp(
            AppTarget(
                displayNameBengali = "ফেসবুক",
                displayNameEnglish = "Facebook",
                packageNames = listOf("com.facebook.katana", "com.facebook.lite"),
                spokenAliases = listOf("ফেসবুক", "facebook", "fb", "ফেবুক")
            )
        )

        // 3. WhatsApp
        registerApp(
            AppTarget(
                displayNameBengali = "হোয়াটসঅ্যাপ",
                displayNameEnglish = "WhatsApp",
                packageNames = listOf("com.whatsapp", "com.whatsapp.w4b"),
                spokenAliases = listOf("হোয়াটসঅ্যাপ", "whatsapp", "হোয়াটস্যাপ", "watsapp")
            )
        )

        // 4. Google Chrome / Browser
        registerApp(
            AppTarget(
                displayNameBengali = "ক্রোম ব্রাউজার",
                displayNameEnglish = "Google Chrome",
                packageNames = listOf("com.android.chrome"),
                spokenAliases = listOf("ক্রোম", "chrome", "ব্রাউজার", "browser")
            )
        )

        // 5. Settings
        registerApp(
            AppTarget(
                displayNameBengali = "সেটিংস",
                displayNameEnglish = "Settings",
                packageNames = listOf("com.android.settings"),
                spokenAliases = listOf("সেটিংস", "settings", "ফোন সেটিংস")
            )
        )

        // 6. Camera
        registerApp(
            AppTarget(
                displayNameBengali = "ক্যামেরা",
                displayNameEnglish = "Camera",
                packageNames = listOf("com.android.camera", "com.google.android.GoogleCamera"),
                spokenAliases = listOf("ক্যামেরা", "camera")
            )
        )
    }

    /**
     * Allows dynamically registering more applications into the launcher.
     */
    fun registerApp(target: AppTarget) {
        appRegistry.add(target)
    }

    sealed class LaunchResult {
        data class Success(val appName: String) : LaunchResult()
        data class AppNotInstalled(val appName: String) : LaunchResult()
        data class UnknownApp(val query: String) : LaunchResult()
        data class Error(val message: String) : LaunchResult()
    }

    /**
     * Attempts to launch an app matching the spoken name.
     */
    fun launchAppByName(rawQuery: String): LaunchResult {
        val query = rawQuery.lowercase().trim()
        Log.d(TAG, "Attempting to launch app for query: '$query'")

        // 1. Search in known registry
        val matchedTarget = appRegistry.firstOrNull { target ->
            target.spokenAliases.any { alias ->
                query.contains(alias.lowercase())
            }
        }

        if (matchedTarget != null) {
            return launchByTarget(matchedTarget)
        }

        // 2. Search dynamically across all installed packages
        return searchAndLaunchInstalledApps(query)
    }

    private fun launchByTarget(target: AppTarget): LaunchResult {
        val pm = context.packageManager
        for (pkg in target.packageNames) {
            val intent = pm.getLaunchIntentForPackage(pkg)
            if (intent != null) {
                try {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                    return LaunchResult.Success(target.displayNameBengali)
                } catch (e: Exception) {
                    Log.e(TAG, "Error starting intent for $pkg: ${e.message}")
                }
            }
        }

        // App target was recognized, but is not installed on this device
        return LaunchResult.AppNotInstalled(target.displayNameBengali)
    }

    /**
     * Dynamic package lookup for apps not explicitly in the static registry.
     */
    private fun searchAndLaunchInstalledApps(query: String): LaunchResult {
        val pm = context.packageManager
        val installedApps = pm.getInstalledApplications(PackageManager.GET_META_DATA)

        for (appInfo in installedApps) {
            val label = pm.getApplicationLabel(appInfo).toString().lowercase()
            if (label.contains(query) || query.contains(label)) {
                val launchIntent = pm.getLaunchIntentForPackage(appInfo.packageName)
                if (launchIntent != null) {
                    try {
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(launchIntent)
                        val appName = pm.getApplicationLabel(appInfo).toString()
                        return LaunchResult.Success(appName)
                    } catch (e: Exception) {
                        Log.e(TAG, "Dynamic launch failed for ${appInfo.packageName}: ${e.message}")
                    }
                }
            }
        }

        return LaunchResult.UnknownApp(query)
    }

    /**
     * Checks whether YouTube is installed.
     */
    fun isYouTubeInstalled(): Boolean {
        return isPackageInstalled("com.google.android.youtube")
    }

    /**
     * Checks whether Facebook is installed.
     */
    fun isFacebookInstalled(): Boolean {
        return isPackageInstalled("com.facebook.katana") || isPackageInstalled("com.facebook.lite")
    }

    fun isPackageInstalled(packageName: String): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }
}
