package com.anisalqulub.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "surahs")
data class Surah(
    @PrimaryKey val number: Int,
    val name: String,
    val englishName: String,
    val englishNameTranslation: String,
    val revelationType: String,
    val numberOfAyahs: Int
)

@Entity(tableName = "ayahs")
data class Ayah(
    @PrimaryKey val number: Int, // 1..6236
    val surahNumber: Int,
    val numberInSurah: Int,
    val text: String,
    val page: Int,
    val juz: Int,
    val hizbQuarter: Int,
    val sajda: Boolean = false,
    var audioUrl: String? = null
)

@Entity(tableName = "tafsirs", primaryKeys = ["surahNumber", "ayahNumber", "edition"])
data class Tafsir(
    val surahNumber: Int,
    val ayahNumber: Int,
    val edition: String, // "ar.muyassar", "ar.qurtubi", "ar.baghawi", etc.
    val tafsirName: String,
    val text: String
)

data class PrayerTime(
    val id: String,
    val nameAr: String,
    val nameEn: String,
    val timeFormatted: String,
    val hour: Int,
    val minute: Int,
    val isNext: Boolean = false
)

@Entity(tableName = "adhkar")
data class Dhikr(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val category: String, // "morning", "evening", "sleep", "prayer_after"
    val text: String,
    val countTarget: Int,
    val currentCount: Int = 0,
    val reward: String = "",
    val reference: String = ""
)

@Entity(tableName = "bookmarks")
data class Bookmark(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val surahNumber: Int,
    val surahName: String,
    val ayahNumber: Int,
    val pageNumber: Int,
    val timestamp: Long = System.currentTimeMillis(),
    val note: String? = null
)
