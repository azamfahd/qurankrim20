package com.anisalqulub.app.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = Emerald500,
    secondary = GoldAccent,
    tertiary = TealAccent,
    background = Slate950,
    surface = Slate900,
    onPrimary = Emerald900,
    onSecondary = Slate950,
    onTertiary = Slate950,
    onBackground = Slate100,
    onSurface = Slate100
)

private val LightColorScheme = lightColorScheme(
    primary = Emerald800,
    secondary = GoldAccent,
    tertiary = TealAccent,
    background = Slate50,
    surface = QuranPageCream,
    onPrimary = Slate50,
    onSecondary = Slate950,
    onTertiary = Slate50,
    onBackground = Slate900,
    onSurface = QuranAyahText
)

@Composable
fun AnisAlQulubTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Preserve Islamic Aesthetic Emerald Theme
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = if (darkTheme) Slate950.toArgb() else Emerald900.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
