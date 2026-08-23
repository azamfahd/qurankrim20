import express from "express";
import path from "path";
import fs from "fs";
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from "adhan";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve static adhan audio files directly
  const audioPublicPath = path.join(process.cwd(), "public", "audio", "adhan");
  app.use("/audio/adhan", express.static(audioPublicPath, {
    maxAge: "30d",
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Accept-Ranges", "bytes");
    }
  }));

  // Adhan streaming & downloading proxy endpoint
  app.get("/api/adhan/stream/:id", (req, res) => {
    try {
      const muezzinId = req.params.id;
      const localFilePath = path.join(audioPublicPath, `${muezzinId}.mp3`);
      
      if (fs.existsSync(localFilePath)) {
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Accept-Ranges", "bytes");
        const stream = fs.createReadStream(localFilePath);
        return stream.pipe(res);
      }

      // Map to fallback CDN if local file not found
      const cdnMap: Record<string, string> = {
        mishary: "https://cdn.aladhan.com/audio/adhans/a1.mp3",
        al_mulla: "https://cdn.aladhan.com/audio/adhans/a2.mp3",
        abdulbasit: "https://cdn.aladhan.com/audio/adhans/a3.mp3",
        mansour: "https://cdn.aladhan.com/audio/adhans/a4.mp3",
        alghamdi: "https://cdn.aladhan.com/audio/adhans/a5.mp3",
        qatami: "https://cdn.aladhan.com/audio/adhans/a6.mp3",
        madina: "https://cdn.aladhan.com/audio/adhans/a7.mp3",
        aqsa: "https://cdn.aladhan.com/audio/adhans/a8.mp3",
      };

      const cdnUrl = cdnMap[muezzinId] || "https://cdn.aladhan.com/audio/adhans/a1.mp3";
      res.redirect(cdnUrl);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to stream audio" });
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Prayer times API endpoint for backend calculations & verification
  app.get("/api/prayer-times", (req, res) => {
    try {
      const lat = parseFloat(req.query.latitude as string) || 21.4225; // Default Makkah
      const lng = parseFloat(req.query.longitude as string) || 39.8262;
      const methodStr = (req.query.method as string) || "MuslimWorldLeague";
      
      const coords = new Coordinates(lat, lng);
      let params = CalculationMethod.MuslimWorldLeague();
      if (methodStr === "UmmAlQura") params = CalculationMethod.UmmAlQura();
      else if (methodStr === "Egyptian") params = CalculationMethod.Egyptian();
      else if (methodStr === "Karachi") params = CalculationMethod.Karachi();
      else if (methodStr === "Dubai") params = CalculationMethod.Dubai();
      params.madhab = Madhab.Shafi;

      const date = new Date();
      const times = new PrayerTimes(coords, date, params);

      res.json({
        success: true,
        coordinates: { latitude: lat, longitude: lng },
        date: date.toISOString(),
        calculationMethod: methodStr,
        times: {
          fajr: times.fajr.toISOString(),
          sunrise: times.sunrise.toISOString(),
          dhuhr: times.dhuhr.toISOString(),
          asr: times.asr.toISOString(),
          maghrib: times.maghrib.toISOString(),
          isha: times.isha.toISOString(),
        },
        currentPrayer: times.currentPrayer(),
        nextPrayer: times.nextPrayer()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to calculate prayer times" });
    }
  });

  // Muezzins configuration list endpoint
  app.get("/api/adhan/muezzins", (req, res) => {
    res.json({
      success: true,
      muezzins: [
        {
          id: "mishary",
          name: "مشاري راشد العفاسي",
          description: "أذان هادئ وخاشع ورخيم",
          audioUrls: [
            "https://cdn.islamic.network/prayer-times/audio/adhan/mishary.mp3",
            "https://media.sd.ma/assabile/adhan_345345345/adhan_alafasy.mp3"
          ]
        },
        {
          id: "al_mulla",
          name: "الشيخ علي أحمد ملا",
          description: "أذان الحرم المكي الشريف التاريخي",
          audioUrls: [
            "https://cdn.islamic.network/prayer-times/audio/adhan/makkah.mp3",
            "https://media.sd.ma/assabile/adhan_345345345/ali_ibn_ahmed_mala.mp3"
          ]
        },
        {
          id: "abdulbasit",
          name: "الشيخ عبد الباسط عبد الصمد",
          description: "أذان مصري أصيل بنبرة تاريخية عذبة",
          audioUrls: [
            "https://cdn.islamic.network/prayer-times/audio/adhan/abdulbasit.mp3",
            "https://media.sd.ma/assabile/adhan_345345345/abdelbasset_abdessamad.mp3"
          ]
        },
        {
          id: "mansour",
          name: "الشيخ منصور الزهراني",
          description: "أذان حجازي عذب وبصوت ندي",
          audioUrls: [
            "https://cdn.islamic.network/prayer-times/audio/adhan/zahrani.mp3",
            "https://media.sd.ma/assabile/adhan_345345345/mansour_alzahrani.mp3"
          ]
        },
        {
          id: "alghamdi",
          name: "الشيخ سعد الغامدي",
          description: "أذان نقي ومؤثر يريح القلوب",
          audioUrls: [
            "https://cdn.islamic.network/prayer-times/audio/adhan/alghamdi.mp3",
            "https://media.sd.ma/assabile/adhan_345345345/saad_al_ghamidi.mp3"
          ]
        },
        {
          id: "qatami",
          name: "الشيخ ناصر القطامي",
          description: "أذان خاشع وعميق التأثير",
          audioUrls: [
            "https://cdn.islamic.network/prayer-times/audio/adhan/qatami.mp3",
            "https://media.sd.ma/assabile/adhan_345345345/nasser_alqatami.mp3"
          ]
        }
      ]
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
