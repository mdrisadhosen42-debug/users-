package com.jannat.ai

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.graphics.Path
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * JannatAccessibilityService handles explicit user-requested screen navigation.
 *
 * CRITICAL SAFETY RULES:
 * 1. Jannat must NEVER independently control the phone or perform actions on its own.
 * 2. Actions are executed ONLY upon an explicit, direct command from the user.
 * 3. Does not monitor or record private screen contents for unrelated purposes.
 */
class JannatAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "JannatAccessService"

        // Thread-safe instance reference for explicit command execution
        @Volatile
        private var instance: JannatAccessibilityService? = null

        /**
         * Checks if the Jannat Accessibility Service is currently connected and enabled.
         */
        fun isServiceRunning(): Boolean {
            return instance != null
        }

        /**
         * Executes the requested screen action if the service is active and user commanded it.
         */
        fun performAction(actionType: ScreenAction): Boolean {
            val service = instance
            if (service == null) {
                Log.w(TAG, "AccessibilityService is not connected.")
                return false
            }

            return when (actionType) {
                ScreenAction.BACK -> service.performBack()
                ScreenAction.HOME -> service.performHome()
                ScreenAction.LOCK_SCREEN -> service.performLockScreen()
                ScreenAction.SCROLL_DOWN -> service.performScrollDown()
                ScreenAction.SCROLL_UP -> service.performScrollUp()
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
        Log.i(TAG, "Jannat Accessibility Service connected successfully.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // No unsolicited passive monitoring; we strictly wait for explicit user commands
    }

    override fun onInterrupt() {
        Log.w(TAG, "Jannat Accessibility Service interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
        Log.i(TAG, "Jannat Accessibility Service destroyed.")
    }

    /**
     * Navigates back upon explicit user command ("পিছনে যাও" / "Back").
     */
    private fun performBack(): Boolean {
        Log.d(TAG, "Executing explicit command: GLOBAL_ACTION_BACK")
        return performGlobalAction(GLOBAL_ACTION_BACK)
    }

    /**
     * Navigates to the Home screen upon explicit user command ("হোমে যাও" / "Home").
     */
    private fun performHome(): Boolean {
        Log.d(TAG, "Executing explicit command: GLOBAL_ACTION_HOME")
        return performGlobalAction(GLOBAL_ACTION_HOME)
    }

    /**
     * Locks the phone screen upon explicit user command ("ফোন লক করো" / "Lock screen").
     * Supported natively on Android 9.0 (API 28) and higher via GLOBAL_ACTION_LOCK_SCREEN.
     */
    private fun performLockScreen(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            Log.d(TAG, "Executing explicit command: GLOBAL_ACTION_LOCK_SCREEN")
            performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)
        } else {
            Log.w(TAG, "Lock screen requires Android 9.0 (Pie) or higher.")
            false
        }
    }

    /**
     * Scrolls down the current screen content ("নিচে স্ক্রল করো" / "Scroll down").
     */
    private fun performScrollDown(): Boolean {
        Log.d(TAG, "Executing explicit command: Scroll Down")

        // First attempt: scroll the focused scrollable accessibility node
        val rootNode = rootInActiveWindow
        if (rootNode != null) {
            val scrolled = findAndScrollNode(rootNode, AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)
            rootNode.recycle()
            if (scrolled) return true
        }

        // Second attempt: swipe gesture swipe up (which moves content down)
        return performSwipeGesture(isScrollDown = true)
    }

    /**
     * Scrolls up the current screen content ("উপরে স্ক্রল করো" / "উপরে যাও" / "Scroll up").
     */
    private fun performScrollUp(): Boolean {
        Log.d(TAG, "Executing explicit command: Scroll Up")

        val rootNode = rootInActiveWindow
        if (rootNode != null) {
            val scrolled = findAndScrollNode(rootNode, AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD)
            rootNode.recycle()
            if (scrolled) return true
        }

        return performSwipeGesture(isScrollDown = false)
    }

    /**
     * Traverses the node hierarchy looking for scrollable containers.
     */
    private fun findAndScrollNode(node: AccessibilityNodeInfo?, action: Int): Boolean {
        if (node == null) return false

        if (node.isScrollable) {
            val result = node.performAction(action)
            if (result) return true
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            if (child != null) {
                val scrolled = findAndScrollNode(child, action)
                child.recycle()
                if (scrolled) return true
            }
        }
        return false
    }

    /**
     * Fallback gesture dispatch when node-based scrolling is not supported.
     */
    private fun performSwipeGesture(isScrollDown: Boolean): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            return false
        }

        val displayMetrics = resources.displayMetrics
        val middleX = displayMetrics.widthPixels / 2f
        val startY: Float
        val endY: Float

        if (isScrollDown) {
            // Swipe upwards to scroll down content
            startY = displayMetrics.heightPixels * 0.75f
            endY = displayMetrics.heightPixels * 0.25f
        } else {
            // Swipe downwards to scroll up content
            startY = displayMetrics.heightPixels * 0.25f
            endY = displayMetrics.heightPixels * 0.75f
        }

        val path = Path().apply {
            moveTo(middleX, startY)
            lineTo(middleX, endY)
        }

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 300))
            .build()

        return dispatchGesture(gesture, null, null)
    }
}
