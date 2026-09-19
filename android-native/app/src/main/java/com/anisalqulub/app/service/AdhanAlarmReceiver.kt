package com.anisalqulub.app.service

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.MediaPlayer
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.anisalqulub.app.AnisApplication
import com.anisalqulub.app.MainActivity
import com.anisalqulub.app.R

class AdhanAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val prayerName = intent.getStringExtra("prayer_name") ?: "الصلاة"
        val muezzinId = intent.getStringExtra("muezzin_id") ?: "mishary"

        // Acquire partial wakelock to ensure audio plays without being killed by Android Doze
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "AnisAlQulub:AdhanWakeLock"
        )
        wakeLock.acquire(10 * 60 * 1000L /* 10 minutes */)

        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, AnisApplication.CHANNEL_ADHAN_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("🕌 حان موعد أذان صلاة $prayerName")
            .setContentText("الله أكبر، حي على الصلاة، حي على الفلاح")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(prayerName.hashCode(), notification)

        // Release WakeLock after a safety interval
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            if (wakeLock.isHeld) {
                wakeLock.release()
            }
        }, 5 * 60 * 1000L)
    }
}
