package com.anisalqulub.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.os.Build
import androidx.room.Room
import com.anisalqulub.app.data.local.QuranDatabase

class AnisApplication : Application() {

    lateinit var database: QuranDatabase
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initialize Room Local Offline Database
        database = Room.databaseBuilder(
            applicationContext,
            QuranDatabase::class.java,
            "anis_quran_database.db"
        ).fallbackToDestructiveMigration().build()

        // Create Android High-Priority Notification Channels
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // 1. Adhan Prayers Channel (Importance HIGH)
            val adhanChannel = NotificationChannel(
                CHANNEL_ADHAN_ID,
                getString(R.string.channel_adhan_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = getString(R.string.channel_adhan_desc)
                enableVibration(true)
                setBypassDnd(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }

            // 2. Dhikr & Reminders Channel
            val dhikrChannel = NotificationChannel(
                CHANNEL_DHIKR_ID,
                getString(R.string.channel_dhikr_name),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = getString(R.string.channel_dhikr_desc)
                enableVibration(true)
            }

            // 3. Audio Player Media Session Channel
            val audioChannel = NotificationChannel(
                CHANNEL_AUDIO_ID,
                getString(R.string.channel_audio_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.channel_audio_desc)
            }

            notificationManager.createNotificationChannels(listOf(adhanChannel, dhikrChannel, audioChannel))
        }
    }

    companion object {
        const val CHANNEL_ADHAN_ID = "anis_adhan_high_priority_v1"
        const val CHANNEL_DHIKR_ID = "anis_dhikr_channel_v1"
        const val CHANNEL_AUDIO_ID = "anis_quran_playback_v1"

        lateinit var instance: AnisApplication
            private set
    }
}
