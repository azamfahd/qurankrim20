package com.anisalqulub.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CompassCalibration
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.anisalqulub.app.data.model.PrayerTime
import com.anisalqulub.app.theme.Emerald800
import com.anisalqulub.app.theme.GoldAccent

@Composable
fun PrayerTimesScreen() {
    val prayerTimes = remember {
        listOf(
            PrayerTime("fajr", "الفجر", "Fajr", "04:38 ص", 4, 38, false),
            PrayerTime("sunrise", "الشروق", "Sunrise", "05:58 ص", 5, 58, false),
            PrayerTime("dhuhr", "الظهر", "Dhuhr", "12:15 م", 12, 15, true),
            PrayerTime("asr", "العصر", "Asr", "03:42 م", 15, 42, false),
            PrayerTime("maghrib", "المغرب", "Maghrib", "06:22 م", 18, 22, false),
            PrayerTime("isha", "العشاء", "Isha", "07:52 م", 19, 52, false)
        )
    }

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Emerald800)
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "مواقيت الصلاة والأذان",
                            style = MaterialTheme.typography.titleLarge,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(Icons.Default.LocationOn, contentDescription = "الموقع", tint = GoldAccent, modifier = Modifier.size(14.dp))
                            Text(
                                text = "مكة المكرمة • التوقيت الدقيق",
                                fontSize = 12.sp,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                        }
                    }

                    IconButton(onClick = { /* Open Qibla Compass */ }) {
                        Icon(Icons.Default.CompassCalibration, contentDescription = "القبلة", tint = GoldAccent)
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Next Prayer Banner
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Emerald800),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("الصلاة القادمة", color = GoldAccent, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("صلاة الظهر", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 26.sp)
                        Text("12:15 م", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 20.sp)
                        Spacer(modifier = Modifier.height(10.dp))
                        Text("متبقي: ساعتان و 14 دقيقة", color = Color.White.copy(alpha = 0.85f), fontSize = 13.sp)
                    }
                }
            }

            items(prayerTimes) { prayer ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (prayer.isNext) Emerald800.copy(alpha = 0.08f) else MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Icon(Icons.Default.VolumeUp, contentDescription = "أذان", tint = if (prayer.isNext) Emerald800 else Color.Gray)
                            Column {
                                Text(prayer.nameAr, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text(prayer.nameEn, fontSize = 12.sp, color = Color.Gray)
                            }
                        }
                        Text(prayer.timeFormatted, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = if (prayer.isNext) Emerald800 else Color.Black)
                    }
                }
            }
        }
    }
}
