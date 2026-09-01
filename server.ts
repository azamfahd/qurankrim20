import express from "express";
import path from "path";
import fs from "fs";
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from "adhan";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Root healthcheck endpoints for Cloud Run and load balancers
  app.get(["/healthz", "/api/health"], (req, res) => {
    res.status(200).json({ status: "ok", port: PORT, timestamp: new Date().toISOString() });
  });

  // Serve static adhan audio files directly
  const audioPublicPath = path.join(process.cwd(), "public", "audio", "adhan");
  if (!fs.existsSync(audioPublicPath)) {
    fs.mkdirSync(audioPublicPath, { recursive: true });
  }
  app.use("/audio/adhan", express.static(audioPublicPath, {
    maxAge: "30d",
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Accept-Ranges", "bytes");
    }
  }));

  // Serve Digital Asset Links for Android TWA / APK standalone validation
  app.get("/.well-known/assetlinks.json", (req, res) => {
    const assetlinksPath = path.join(process.cwd(), "public", ".well-known", "assetlinks.json");
    if (fs.existsSync(assetlinksPath)) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      return res.sendFile(assetlinksPath);
    }
    return res.status(404).json({ error: "assetlinks.json not found" });
  });

  // App & APK version endpoint for Service Worker live updates
  app.get("/api/version", (req, res) => {
    const apkPath = path.join(process.cwd(), "public", "app-release.apk");
    let apkExists = false;
    let apkSize = 0;
    let lastModified = new Date().toISOString();

    if (fs.existsSync(apkPath)) {
      apkExists = true;
      const stats = fs.statSync(apkPath);
      apkSize = stats.size;
      lastModified = stats.mtime.toISOString();
    }

    const sizeFormatted = apkSize > 0 ? `${(apkSize / (1024 * 1024)).toFixed(2)} MB` : '1.6 MB';

    res.json({
      name: "أنيس القلوب",
      version: "1.1.0",
      packageName: "app.azamfahd.qurankrim20.twa",
      updatedAt: lastModified,
      apk: {
        available: apkExists,
        version: "1.1.0",
        size: apkSize,
        sizeFormatted: sizeFormatted,
        downloadUrl: "/app-release.apk",
        releaseNotes: "تحسينات في سرعة التصفح والاستجابة وعمل المصواقيت دون اتصال."
      }
    });
  });

  // Direct APK download routes with proper headers and encoding support
  app.get(["/app-release.apk", "/api/download-apk", encodeURI("/أنيس القلوب - رفيقك القرآني.apk")], (req, res) => {
    const apkPath = path.join(process.cwd(), "public", "app-release.apk");
    if (fs.existsSync(apkPath)) {
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Disposition", 'attachment; filename="anis-al-qulub.apk"');
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.sendFile(apkPath);
    }
    return res.status(404).json({ error: "APK file not found" });
  });

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
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send("App is running. Dist bundle building...");
      }
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  const shutdown = () => {
    console.log("Shutting down server gracefully...");
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();
