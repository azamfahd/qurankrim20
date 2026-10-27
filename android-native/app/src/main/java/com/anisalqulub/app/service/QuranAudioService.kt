package com.anisalqulub.app.service

import android.app.PendingIntent
import android.content.Intent
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.anisalqulub.app.MainActivity

class QuranAudioService : MediaSessionService() {

    private var mediaSession: MediaSession? = null
    private var player: ExoPlayer? = null

    override fun onCreate() {
        super.onCreate()

        val audioAttributes = AudioAttributes.Builder()
            .setContentType(C.AUDIO_CONTENT_TYPE_SPEECH)
            .setUsage(C.USAGE_MEDIA)
            .build()

        player = ExoPlayer.Builder(this)
            .setAudioAttributes(audioAttributes, true)
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .build()

        val sessionActivityPendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        player?.let {
            mediaSession = MediaSession.Builder(this, it)
                .setSessionActivity(sessionActivityPendingIntent)
                .build()
        }
    }

    /**
     * Configure ExoPlayer playlist (MediaItems) for all surah ayahs without 7-ayah limit
     * to ensure seamless gapless playback across the entire surah playlist.
     */
    fun setSurahPlaylist(audioUrls: List<String>) {
        val mediaItems = audioUrls.map { androidx.media3.common.MediaItem.fromUri(it) }
        player?.apply {
            stop()
            clearMediaItems()
            setMediaItems(mediaItems)
            prepare()
            play()
        }
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        return mediaSession
    }

    override fun onDestroy() {
        mediaSession?.run {
            player.release()
            release()
            mediaSession = null
        }
        super.onDestroy()
    }
}
