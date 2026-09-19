package com.anisalqulub.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.anisalqulub.app.data.model.Surah
import com.anisalqulub.app.theme.Emerald800
import com.anisalqulub.app.theme.GoldAccent
import com.anisalqulub.app.ui.navigation.Screen

@Composable
fun SurahListScreen(
    navController: NavController,
    onSurahSelected: (Int) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }

    // Sample list of 114 Surahs for instant UI response (will sync with Room DB)
    val sampleSurahs = remember {
        listOf(
            Surah(1, "الفاتحة", "Al-Faatiha", "The Opening", "Meccan", 7),
            Surah(2, "البقرة", "Al-Baqara", "The Cow", "Medinan", 286),
            Surah(3, "آل عمران", "Aal-i-Imraan", "The Family of Imraan", "Medinan", 200),
            Surah(4, "النساء", "An-Nisaa", "The Women", "Medinan", 176),
            Surah(5, "المائدة", "Al-Maaida", "The Table Spread", "Medinan", 120),
            Surah(6, "الأنعام", "Al-An'aam", "The Cattle", "Meccan", 165),
            Surah(7, "الأعراف", "Al-A'raaf", "The Heights", "Meccan", 206),
            Surah(8, "الأنفال", "Al-Anfaal", "The Spoils of War", "Medinan", 75),
            Surah(9, "التوبة", "At-Tawba", "The Repentance", "Medinan", 129),
            Surah(10, "يونس", "Yunus", "Jonah", "Meccan", 109),
            Surah(11, "هود", "Hud", "Hud", "Meccan", 123),
            Surah(12, "يوسف", "Yusuf", "Joseph", "Meccan", 111),
            Surah(13, "الرعد", "Ar-Ra'd", "The Thunder", "Medinan", 43),
            Surah(14, "إبراهيم", "Ibrahim", "Abraham", "Meccan", 52),
            Surah(15, "الحجر", "Al-Hijr", "The Rocky Tract", "Meccan", 99),
            Surah(16, "النحل", "An-Nahl", "The Bee", "Meccan", 128),
            Surah(17, "الإسراء", "Al-Israa", "The Night Journey", "Meccan", 111),
            Surah(18, "الكهف", "Al-Kahf", "The Cave", "Meccan", 110),
            Surah(19, "مريم", "Maryam", "Mary", "Meccan", 98),
            Surah(20, "طه", "Taa-Haa", "Ta-Ha", "Meccan", 135),
            Surah(36, "يس", "Yaseen", "Ya-Sin", "Meccan", 83),
            Surah(55, "الرحمن", "Ar-Rahmaan", "The Beneficent", "Medinan", 78),
            Surah(56, "الواقعة", "Al-Waaqia", "The Inevitable", "Meccan", 96),
            Surah(67, "الملك", "Al-Mulk", "The Sovereignty", "Meccan", 30),
            Surah(112, "الإخلاص", "Al-Ikhlaas", "The Sincerity", "Meccan", 4),
            Surah(113, "الفلق", "Al-Falaq", "The Daybreak", "Meccan", 5),
            Surah(114, "الناس", "An-Naas", "Mankind", "Meccan", 6)
        )
    }

    val filteredSurahs = sampleSurahs.filter {
        it.name.contains(searchQuery, ignoreCase = true) ||
        it.englishName.contains(searchQuery, ignoreCase = true) ||
        it.number.toString() == searchQuery
    }

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Emerald800)
                    .padding(16.dp)
            ) {
                Text(
                    text = "فهرس القرآن الكريم",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("ابحث باسم السورة أو رقمها...", color = Color.White.copy(alpha = 0.7f)) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "بحث", tint = Color.White) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White.copy(alpha = 0.15f),
                        unfocusedContainerColor = Color.White.copy(alpha = 0.1f),
                        focusedBorderColor = GoldAccent,
                        unfocusedBorderColor = Color.Transparent,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    singleLine = true
                )
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(filteredSurahs, key = { it.number }) { surah ->
                SurahItemCard(
                    surah = surah,
                    onClick = {
                        onSurahSelected(surah.number)
                        navController.navigate(Screen.QuranReader.createRoute(surah.number))
                    }
                )
            }
        }
    }
}

@Composable
fun SurahItemCard(surah: Surah, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(Emerald800.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "${surah.number}",
                        fontWeight = FontWeight.Bold,
                        color = Emerald800,
                        fontSize = 14.sp
                    )
                }

                Column {
                    Text(
                        text = surah.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${if (surah.revelationType == "Meccan") "مكية" else "مدنية"} • ${surah.numberOfAyahs} آية",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }

            Text(
                text = surah.englishName,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = GoldAccent
            )
        }
    }
}
