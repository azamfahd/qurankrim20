package com.anisalqulub.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.anisalqulub.app.data.model.Ayah
import com.anisalqulub.app.theme.Emerald800
import com.anisalqulub.app.theme.GoldAccent
import com.anisalqulub.app.theme.QuranPageCream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuranReaderScreen(
    surahNumber: Int,
    navController: NavController
) {
    var selectedAyahForTafsir by remember { mutableStateOf<Ayah?>(null) }
    var isAudioPlaying by remember { mutableStateOf(false) }

    // Sample Ayahs for instant rendering
    val ayahs = remember(surahNumber) {
        if (surahNumber == 1) {
            listOf(
                Ayah(1, 1, 1, "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", 1, 1, 1),
                Ayah(2, 1, 2, "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", 1, 1, 1),
                Ayah(3, 1, 3, "الرَّحْمَٰنِ الرَّحِيمِ", 1, 1, 1),
                Ayah(4, 1, 4, "مَالِكِ يَوْمِ الدِّينِ", 1, 1, 1),
                Ayah(5, 1, 5, "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", 1, 1, 1),
                Ayah(6, 1, 6, "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", 1, 1, 1),
                Ayah(7, 1, 7, "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", 1, 1, 1)
            )
        } else {
            listOf(
                Ayah(1, surahNumber, 1, "الم", 2, 1, 1),
                Ayah(2, surahNumber, 2, "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ", 2, 1, 1),
                Ayah(3, surahNumber, 3, "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ", 2, 1, 1)
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("سورة الفاتحة", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "رجوع")
                    }
                },
                actions = {
                    IconButton(onClick = { /* Toggle bookmark */ }) {
                        Icon(Icons.Default.BookmarkBorder, contentDescription = "حفظ الصفحة")
                    }
                    IconButton(onClick = { isAudioPlaying = !isAudioPlaying }) {
                        Icon(
                            if (isAudioPlaying) Icons.Default.PauseCircle else Icons.Default.PlayCircle,
                            contentDescription = "تشغيل الصوت",
                            tint = GoldAccent
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Emerald800,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White,
                    actionIconContentColor = Color.White
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(QuranPageCream)
                .padding(padding)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Basmala header
                if (surahNumber != 9) {
                    item {
                        Text(
                            text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            color = Emerald800
                        )
                    }
                }

                items(ayahs, key = { it.number }) { ayah ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedAyahForTafsir = ayah },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "الآية ${ayah.numberInSurah}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = GoldAccent,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "تفسير الآية 📖",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Emerald800,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = ayah.text + " ﴿" + ayah.numberInSurah + "﴾",
                                fontSize = 22.sp,
                                lineHeight = 38.sp,
                                textAlign = TextAlign.Right,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF1E293B),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }
            }
        }

        // Tafsir Bottom Sheet
        if (selectedAyahForTafsir != null) {
            ModalBottomSheet(
                onDismissRequest = { selectedAyahForTafsir = null },
                containerColor = Color.White
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Text(
                        text = "التفسير الميسر • الآية ${selectedAyahForTafsir?.numberInSurah}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Emerald800
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "﴿${selectedAyahForTafsir?.text}﴾",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = GoldAccent,
                        textAlign = TextAlign.Right
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "معنى وتفسير الآية الكريمة بياناً وتوضيحاً لمعاني الكلمات وأسباب النزول ودلالات الألفاظ المباركة لتيسير الفهم والتدبر للمسلم.",
                        fontSize = 15.sp,
                        lineHeight = 24.sp,
                        textAlign = TextAlign.Right,
                        color = Color(0xFF334155)
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}
