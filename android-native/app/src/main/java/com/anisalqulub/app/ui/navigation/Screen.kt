package com.anisalqulub.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val titleAr: String, val icon: ImageVector) {
    object QuranList : Screen("quran_list", "المصحف", Icons.Default.MenuBook)
    object QuranReader : Screen("quran_reader/{surahNumber}", "القراءة", Icons.Default.AutoStories) {
        fun createRoute(surahNumber: Int) = "quran_reader/$surahNumber"
    }
    object PrayerTimes : Screen("prayer_times", "المواقيت", Icons.Default.AccessTime)
    object Adhkar : Screen("adhkar", "الأذكار", Icons.Default.Spa)
    object Settings : Screen("settings", "الإعدادات", Icons.Default.Settings)
}
