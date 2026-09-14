package com.jannat.ai

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * DiagnosticsActivity displays detailed status of phone hardware, internet,
 * permissions, and accessibility services with safe actionable resolution steps.
 */
class DiagnosticsActivity : AppCompatActivity() {

    private lateinit var diagnosticsManager: DiagnosticsManager
    private lateinit var layoutDiagnosticsList: LinearLayout
    private lateinit var tvOverallStatus: TextView
    private lateinit var tvLastChecked: TextView
    private lateinit var btnRunDiagnostics: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_diagnostics)

        diagnosticsManager = DiagnosticsManager(this)

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbarDiagnostics)
        toolbar.setNavigationOnClickListener {
            finish()
        }

        layoutDiagnosticsList = findViewById(R.id.layoutDiagnosticsList)
        tvOverallStatus = findViewById(R.id.tvDiagnosticsOverallStatus)
        tvLastChecked = findViewById(R.id.tvDiagnosticsLastChecked)
        btnRunDiagnostics = findViewById(R.id.btnRunDiagnostics)

        btnRunDiagnostics.setOnClickListener {
            renderDiagnostics()
        }

        renderDiagnostics()
    }

    override fun onResume() {
        super.onResume()
        // Refresh statuses in case user returned from Android Settings
        renderDiagnostics()
    }

    private fun renderDiagnostics() {
        val items = diagnosticsManager.runFullDiagnostics()
        layoutDiagnosticsList.removeAllViews()

        var hasErrors = false
        var hasWarnings = false

        val inflater = LayoutInflater.from(this)

        for (item in items) {
            val itemView = inflater.inflate(R.layout.item_diagnostic, layoutDiagnosticsList, false)

            val tvTitle = itemView.findViewById<TextView>(R.id.tvDiagTitle)
            val tvBadge = itemView.findViewById<TextView>(R.id.tvDiagBadge)
            val tvDesc = itemView.findViewById<TextView>(R.id.tvDiagDescription)
            val layoutAction = itemView.findViewById<View>(R.id.layoutDiagAction)
            val btnAction = itemView.findViewById<MaterialButton>(R.id.btnDiagAction)

            tvTitle.text = item.titleBengali
            tvBadge.text = item.statusText
            tvDesc.text = item.description

            when (item.level) {
                DiagnosticsManager.HealthLevel.GOOD -> {
                    tvBadge.setBackgroundColor(ContextCompat.getColor(this, R.color.success))
                }
                DiagnosticsManager.HealthLevel.WARNING -> {
                    hasWarnings = true
                    tvBadge.setBackgroundColor(ContextCompat.getColor(this, R.color.warning))
                }
                DiagnosticsManager.HealthLevel.ERROR -> {
                    hasErrors = true
                    tvBadge.setBackgroundColor(ContextCompat.getColor(this, R.color.error))
                }
            }

            // Handle actions safely
            if (item.actionLabel != null) {
                layoutAction.visibility = View.VISIBLE
                btnAction.text = item.actionLabel

                btnAction.setOnClickListener {
                    if (item.isAutoFixable) {
                        val fixed = diagnosticsManager.performSafeRamCleanup()
                        if (fixed) {
                            Toast.makeText(this, "মেমরি সাময়িকভাবে অপ্টিমাইজ করা হয়েছে", Toast.LENGTH_SHORT).show()
                            renderDiagnostics()
                        }
                    } else if (item.actionIntent != null) {
                        try {
                            startActivity(item.actionIntent)
                        } catch (e: Exception) {
                            Toast.makeText(this, "সেটিংস খুলতে সমস্যা হয়েছে", Toast.LENGTH_SHORT).show()
                        }
                    } else if (item.id == "mic_permission") {
                        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.fromParts("package", packageName, null)
                        }
                        startActivity(intent)
                    }
                }
            } else {
                layoutAction.visibility = View.GONE
            }

            layoutDiagnosticsList.addView(itemView)
        }

        // Overall banner update
        if (hasErrors) {
            tvOverallStatus.text = "কিছু প্রয়োজনীয় অনুমতি বা সার্ভিসে সমস্যা রয়েছে"
            tvOverallStatus.setTextColor(ContextCompat.getColor(this, R.color.error))
        } else if (hasWarnings) {
            tvOverallStatus.text = "কিছু অপ্টিমাইজেশন প্রয়োজন"
            tvOverallStatus.setTextColor(ContextCompat.getColor(this, R.color.warning))
        } else {
            tvOverallStatus.text = "সবকিছু চমৎকারভাবে কাজ করছে"
            tvOverallStatus.setTextColor(ContextCompat.getColor(this, R.color.success))
        }

        val timeFormat = SimpleDateFormat("hh:mm:ss a", Locale.getDefault())
        tvLastChecked.text = "সর্বশেষ যাচাই: ${timeFormat.format(Date())}"
    }
}
