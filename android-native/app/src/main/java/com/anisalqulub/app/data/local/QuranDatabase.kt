package com.anisalqulub.app.data.local

import androidx.room.*
import com.anisalqulub.app.data.model.Ayah
import com.anisalqulub.app.data.model.Bookmark
import com.anisalqulub.app.data.model.Dhikr
import com.anisalqulub.app.data.model.Surah
import com.anisalqulub.app.data.model.Tafsir
import kotlinx.coroutines.flow.Flow

@Dao
interface SurahDao {
    @Query("SELECT * FROM surahs ORDER BY number ASC")
    fun getAllSurahs(): Flow<List<Surah>>

    @Query("SELECT * FROM surahs WHERE number = :number LIMIT 1")
    suspend fun getSurahByNumber(number: Int): Surah?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSurahs(surahs: List<Surah>)
}

@Dao
interface AyahDao {
    @Query("SELECT * FROM ayahs WHERE surahNumber = :surahNumber ORDER BY numberInSurah ASC")
    fun getAyahsBySurah(surahNumber: Int): Flow<List<Ayah>>

    @Query("SELECT * FROM ayahs WHERE page = :page ORDER BY number ASC")
    fun getAyahsByPage(page: Int): Flow<List<Ayah>>

    @Query("SELECT * FROM ayahs WHERE juz = :juz ORDER BY number ASC")
    fun getAyahsByJuz(juz: Int): Flow<List<Ayah>>

    @Query("SELECT * FROM ayahs WHERE surahNumber = :surahNumber AND numberInSurah = :ayahNumber LIMIT 1")
    suspend fun getAyah(surahNumber: Int, ayahNumber: Int): Ayah?

    @Query("SELECT * FROM ayahs WHERE text LIKE '%' || :query || '%' LIMIT 100")
    suspend fun searchAyahs(query: String): List<Ayah>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAyahs(ayahs: List<Ayah>)
}

@Dao
interface TafsirDao {
    @Query("SELECT * FROM tafsirs WHERE surahNumber = :surahNumber AND ayahNumber = :ayahNumber AND edition = :edition LIMIT 1")
    suspend fun getTafsir(surahNumber: Int, ayahNumber: Int, edition: String): Tafsir?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTafsirs(tafsirs: List<Tafsir>)
}

@Dao
interface DhikrDao {
    @Query("SELECT * FROM adhkar WHERE category = :category")
    fun getAdhkarByCategory(category: String): Flow<List<Dhikr>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAdhkar(adhkar: List<Dhikr>)

    @Update
    suspend fun updateDhikr(dhikr: Dhikr)
}

@Dao
interface BookmarkDao {
    @Query("SELECT * FROM bookmarks ORDER BY timestamp DESC")
    fun getAllBookmarks(): Flow<List<Bookmark>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBookmark(bookmark: Bookmark)

    @Delete
    suspend fun deleteBookmark(bookmark: Bookmark)
}

@Database(
    entities = [Surah::class, Ayah::class, Tafsir::class, Dhikr::class, Bookmark::class],
    version = 1,
    exportSchema = false
)
abstract class QuranDatabase : RoomDatabase() {
    abstract fun surahDao(): SurahDao
    abstract fun ayahDao(): AyahDao
    abstract fun tafsirDao(): TafsirDao
    abstract fun dhikrDao(): DhikrDao
    abstract fun bookmarkDao(): BookmarkDao
}
