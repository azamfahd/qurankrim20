package com.anisalqulub.app.service

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.work.*
import com.anisalqulub.app.AnisApplication
import com.anisalqulub.app.MainActivity
import com.anisalqulub.app.R
import java.util.concurrent.TimeUnit

class DhikrNotificationWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : Worker(context, workerParams) {

    override fun doWork(): Result {
        val dhikrList = listOf(
            "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
            "اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
            "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ",
            "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ",
            "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ"
        )

        val randomDhikr = dhikrList.random()

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            101,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, AnisApplication.CHANNEL_DHIKR_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("📿 ذكر وتسبحة")
            .setContentText(randomDhikr)
            .setStyle(NotificationCompat.BigTextStyle().bigText(randomDhikr))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(2001, notification)

        return Result.success()
    }

    companion object {
        fun schedulePeriodicDhikr(context: Context, intervalHours: Long = 3) {
            val workRequest = PeriodicWorkRequestBuilder<DhikrNotificationWorker>(
                intervalHours, TimeUnit.HOURS
            ).setConstraints(
                Constraints.Builder()
                    .setRequiresBatteryNotLow(false)
                    .build()
            ).build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "anis_periodic_dhikr",
                ExistingPeriodicWorkPolicy.UPDATE,
                workRequest
            )
        }
    }
}
