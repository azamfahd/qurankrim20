package com.anisalqulub.app.data.repository

import com.anisalqulub.app.data.local.QuranDatabase
import com.anisalqulub.app.data.model.Ayah
import com.anisalqulub.app.data.model.Bookmark
import com.anisalqulub.app.data.model.Surah
import com.anisalqulub.app.data.model.Tafsir
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class QuranRepository(private val db: QuranDatabase) {

    val allSurahs: Flow<List<Surah>> = db.surahDao().getAllSurahs()

    fun getAyahsBySurah(surahNumber: Int): Flow<List<Ayah>> =
        db.ayahDao().getAyahsBySurah(surahNumber)

    fun getAyahsByPage(page: Int): Flow<List<Ayah>> =
        db.ayahDao().getAyahsByPage(page)

    val bookmarks: Flow<List<Bookmark>> = db.bookmarkDao().getAllBookmarks()

    suspend fun saveBookmark(bookmark: Bookmark) = withContext(Dispatchers.IO) {
        db.bookmarkDao().insertBookmark(bookmark)
    }

    suspend fun removeBookmark(bookmark: Bookmark) = withContext(Dispatchers.IO) {
        db.bookmarkDao().deleteBookmark(bookmark)
    }

    suspend fun getTafsir(surahNumber: Int, ayahNumber: Int, edition: String = "ar.muyassar"): Tafsir? =
        withContext(Dispatchers.IO) {
            val local = db.tafsirDao().getTafsir(surahNumber, ayahNumber, edition)
            if (local != null) return@withContext local

            // Fetch from API if not yet in local Room DB
            try {
                val url = URL("https://api.alquran.cloud/v1/ayah/$surahNumber:$ayahNumber/$edition")
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 8000
                conn.readTimeout = 8000
                if (conn.responseCode == 200) {
                    val response = conn.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(response)
                    val text = json.getJSONObject("data").getString("text")
                    val tafsirName = when (edition) {
                        "ar.muyassar" -> "التفسير الميسر"
                        "ar.qurtubi" -> "تفسير القرطبي"
                        "ar.baghawi" -> "تفسير البغوي"
                        "ar.waseet" -> "التفسير الوسيط"
                        "ar.jalalayn" -> "تفسير الجلالين"
                        else -> "تفسير الآية"
                    }
                    val newTafsir = Tafsir(surahNumber, ayahNumber, edition, tafsirName, text)
                    db.tafsirDao().insertTafsirs(listOf(newTafsir))
                    return@withContext newTafsir
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            null
        }

    suspend fun searchAyahs(query: String): List<Ayah> = withContext(Dispatchers.IO) {
        db.ayahDao().searchAyahs(query)
    }
}
