package com.anisalqulub.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.anisalqulub.app.theme.Emerald800
import com.anisalqulub.app.theme.GoldAccent

@Composable
fun SettingsScreen() {
    var adhanNotificationEnabled by remember { mutableStateOf(true) }
    var dhikrReminderEnabled by remember { mutableStateOf(true) }
    var selectedMuezzin by remember { mutableStateOf("مشاري العفاسي") }
    var selectedReciter by remember { mutableStateOf("محمود خليل الحصري") }

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Emerald800)
                    .padding(20.dp)
            ) {
                Text(
                    text = "الإعدادات والتخصيص الأصيل",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Text("إعدادات الأذان والتنبيهات", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Emerald800)
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("تفعيل صوت الأذان الأصيل", fontWeight = FontWeight.Bold)
                                Text("إطلاق الأذان في الوقت الدقيق عبر قنوات النظام", fontSize = 12.sp, color = Color.Gray)
                            }
                            Switch(
                                checked = adhanNotificationEnabled,
                                onCheckedChange = { adhanNotificationEnabled = it },
                                colors = SwitchDefaults.colors(checkedThumbColor = Emerald800, checkedTrackColor = Emerald800.copy(alpha = 0.3f))
                            )
                        }

                        Divider()

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("المؤذن المعتمد", fontWeight = FontWeight.Bold)
                                Text(selectedMuezzin, fontSize = 12.sp, color = GoldAccent)
                            }
                        }
                    }
                }
            }

            item {
                Text("إعدادات التلاوة والقارئ", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Emerald800)
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("القارئ المعتمد", fontWeight = FontWeight.Bold)
                                Text(selectedReciter, fontSize = 12.sp, color = GoldAccent)
                            }
                        }

                        Divider()

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("تذكيرات الأذكار الدورية", fontWeight = FontWeight.Bold)
                                Text("تنبيه هادئ كل 3 ساعات بالتسبيح", fontSize = 12.sp, color = Color.Gray)
                            }
                            Switch(
                                checked = dhikrReminderEnabled,
                                onCheckedChange = { dhikrReminderEnabled = it },
                                colors = SwitchDefaults.colors(checkedThumbColor = Emerald800, checkedTrackColor = Emerald800.copy(alpha = 0.3f))
                            )
                        }
                    }
                }
            }

            item {
                Text("معلومات التطبيق الأصيل", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Emerald800)
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("أنيس القلوب - الإصدار الأصيل v1.0.0", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("مبني بنظام Kotlin & Jetpack Compose و Material Design 3", fontSize = 12.sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}
