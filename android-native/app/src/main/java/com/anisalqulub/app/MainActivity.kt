package com.anisalqulub.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.anisalqulub.app.service.DhikrNotificationWorker
import com.anisalqulub.app.theme.AnisAlQulubTheme
import com.anisalqulub.app.ui.components.BottomNavBar
import com.anisalqulub.app.ui.navigation.Screen
import com.anisalqulub.app.ui.screens.*

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Schedule Periodic Background Dhikr Notifications
        DhikrNotificationWorker.schedulePeriodicDhikr(this, intervalHours = 3)

        setContent {
            AnisAlQulubTheme {
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    AnisAppMain()
                }
            }
        }
    }
}

@Composable
fun AnisAppMain() {
    val navController = rememberNavController()

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            BottomNavBar(navController = navController)
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.QuranList.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.QuranList.route) {
                SurahListScreen(
                    navController = navController,
                    onSurahSelected = { surahNumber ->
                        navController.navigate(Screen.QuranReader.createRoute(surahNumber))
                    }
                )
            }

            composable(
                route = Screen.QuranReader.route,
                arguments = listOf(navArgument("surahNumber") { type = NavType.IntType })
            ) { backStackEntry ->
                val surahNumber = backStackEntry.arguments?.getInt("surahNumber") ?: 1
                QuranReaderScreen(
                    surahNumber = surahNumber,
                    navController = navController
                )
            }

            composable(Screen.PrayerTimes.route) {
                PrayerTimesScreen()
            }

            composable(Screen.Adhkar.route) {
                AdhkarScreen()
            }

            composable(Screen.Settings.route) {
                SettingsScreen()
            }
        }
    }
}
