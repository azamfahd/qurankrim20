package com.anisalqulub.app.data.repository

import com.anisalqulub.app.data.model.PrayerTime
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.*

class PrayerRepository {

    /**
     * Accurate Astronomical Prayer Times calculation based on coordinates and Umm al-Qura / Egyptian method
     */
    fun calculatePrayerTimes(latitude: Double, longitude: Double, date: Date = Date()): List<PrayerTime> {
        val calendar = Calendar.getInstance().apply { time = date }
        val dayOfYear = calendar.get(Calendar.DAY_OF_YEAR)
        val timezone = TimeZone.getDefault().rawOffset / 3600000.0

        // Approximate Solar Math
        val b = 2 * Math.PI * (dayOfYear - 81) / 365.0
        val eot = 9.87 * sin(2 * b) - 7.53 * cos(b) - 1.5 * sin(b) // Equation of time in minutes
        val declination = Math.toRadians(23.45 * sin(Math.toRadians(360.0 / 365.0 * (dayOfYear - 81)))) // Declination angle

        val noonMinutes = 720 - (4 * longitude) - eot + (timezone * 60)
        val latRad = Math.toRadians(latitude)

        fun getSunAngleTime(angleDegrees: Double, isMorning: Boolean): Double {
            val angleRad = Math.toRadians(angleDegrees)
            val cosH = (sin(angleRad) - sin(latRad) * sin(declination)) / (cos(latRad) * cos(declination))
            val clampedCosH = cosH.coerceIn(-1.0, 1.0)
            val hourAngle = Math.toDegrees(acos(clampedCosH)) / 15.0 * 60.0
            return if (isMorning) noonMinutes - hourAngle else noonMinutes + hourAngle
        }

        // Calculation angles: Fajr (-18.5°), Sunrise (-0.833°), Asr (Shadow factor 1), Maghrib (-0.833°), Isha (-18.5° or +90 mins)
        val fajrMinutes = getSunAngleTime(-18.5, true)
        val sunriseMinutes = getSunAngleTime(-0.833, true)
        val dhuhrMinutes = noonMinutes + 2 // 2 mins safety margin

        // Asr calculation
        val asrAngle = Math.toDegrees(atan(1.0 + tan(abs(latRad - declination))))
        val asrMinutes = getSunAngleTime(90.0 - asrAngle, false)

        val maghribMinutes = getSunAngleTime(-0.833, false) + 2
        val ishaMinutes = maghribMinutes + 90 // Umm al-Qura standard

        val nowMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)

        fun formatTime(totalMinutes: Double, id: String, nameAr: String, nameEn: String): PrayerTime {
            var mins = totalMinutes.toInt()
            if (mins < 0) mins += 1440
            if (mins >= 1440) mins -= 1440
            val h = mins / 60
            val m = mins % 60
            val ampm = if (h < 12) "ص" else "م"
            val displayH = if (h % 12 == 0) 12 else h % 12
            val formatted = String.format(Locale.getDefault(), "%02d:%02d %s", displayH, m, ampm)
            return PrayerTime(id, nameAr, nameEn, formatted, h, m, mins > nowMinutes)
        }

        return listOf(
            formatTime(fajrMinutes, "fajr", "الفجر", "Fajr"),
            formatTime(sunriseMinutes, "sunrise", "الشروق", "Sunrise"),
            formatTime(dhuhrMinutes, "dhuhr", "الظهر", "Dhuhr"),
            formatTime(asrMinutes, "asr", "العصر", "Asr"),
            formatTime(maghribMinutes, "maghrib", "المغرب", "Maghrib"),
            formatTime(ishaMinutes, "isha", "العشاء", "Isha")
        )
    }

    /**
     * Calculate Qibla angle from current coordinates towards Mecca Kaaba (21.4225° N, 39.8262° E)
     */
    fun calculateQiblaDirection(latitude: Double, longitude: Double): Float {
        val kaabaLat = Math.toRadians(21.422487)
        val kaabaLng = Math.toRadians(39.826206)
        val userLat = Math.toRadians(latitude)
        val userLng = Math.toRadians(longitude)

        val dLng = kaabaLng - userLng
        val y = sin(dLng) * cos(kaabaLat)
        val x = cos(userLat) * sin(kaabaLat) - sin(userLat) * cos(kaabaLat) * cos(dLng)
        val qiblaRad = atan2(y, x)
        val qiblaDeg = (Math.toDegrees(qiblaRad) + 360.0) % 360.0
        return qiblaDeg.toFloat()
    }
}
