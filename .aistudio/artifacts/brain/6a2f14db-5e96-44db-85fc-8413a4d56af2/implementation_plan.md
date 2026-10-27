# Implementation Plan - Quran Audio & Download Enhancements

## User Requirements & Bug Fixes
1. **Fix Surah Playback Range / 7-Ayah Limit Bug**: 
   - Currently, `rangeEnd` defaults to `7`, causing playback to stop or loop after 7 ayahs. 
   - Fix: `rangeEnd` will automatically initialize and update to `surahData.numberOfAyahs` when a Surah is loaded or selected.
2. **Fix Continuous Reading & Playback Transition**:
   - Ensure that when continuous reading is enabled (`continuousPlay = true`), playing from any ayah or from the beginning of a Surah seamlessly proceeds to the next ayah (`Ayah N -> Ayah N+1`) until the end of the Surah, and optionally moves to the next Surah, respecting user repeat settings without getting stuck.
3. **Surah Download Status Indicators in Surah List & Audio Player**:
   - Add a download status badge/icon next to each Surah in `QuranIndex.tsx` (surah list) and inside `QuranAudioPlayer.tsx` / audio settings modal, showing whether the surah's audio is fully cached/downloaded for the current reciter.

## Proposed Changes

### 1. `src/quran-platform/store/QuranContext.tsx` & `src/quran-platform/components/QuranAudioPlayer.tsx`
- Ensure `rangeEnd` initializes to `surahData.numberOfAyahs` when surah data loads, rather than defaulting to `7`.
- Refine `handleAudioEnded` and `proceedToNextAudio` to ensure robust continuous playback across ayahs and surahs according to user settings (`continuousPlay`, `repeatMode`, `repeatTimes`).

### 2. `src/quran-platform/components/QuranIndex.tsx` (Surah List)
- Integrate background check or reactive state for downloaded surahs using `AudioCacheService.getSurahDownloadStatus` for each surah or cached status map.
- Display a clear download status indicator (e.g., checkmark / download badge) on each Surah card in the list.

### 3. `src/quran-platform/components/QuranAudioPlayer.tsx` (Audio Player & Settings Modal)
- Enhance the download status display inside the audio settings modal for the active surah with clear indicators and download actions.

## Verification Plan
- Run `compile_applet` to verify TypeScript compilation and build success.
