import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function versionGeneratorPlugin() {
  function getFilesRecursively(dir: string, baseDir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFilesRecursively(filePath, baseDir));
      } else {
        // Exclude specific files that should never be pre-cached in browser Service Worker
        const isExcluded = 
          file === 'sw.js' || 
          file.endsWith('.map') || 
          file.endsWith('.apk') || 
          file.endsWith('.zip') ||
          file.endsWith('.mp3') ||
          file.endsWith('.wav') ||
          file.endsWith('.ogg') ||
          file === '_redirects' || 
          file === '_headers' ||
          file === 'netlify.toml';

        if (!isExcluded) {
          const relativePath = filePath.replace(baseDir, '').replace(/\\/g, '/');
          results.push(relativePath.startsWith('/') ? relativePath : '/' + relativePath);
        }
      }
    });
    return results;
  }

  return {
    name: 'version-generator-plugin',
    generateBundle(options: any, bundle: any) {
      try {
        const buildTimestamp = Date.now();
        const publicDir = path.resolve(__dirname, 'public');
        const versionFile = path.join(publicDir, 'version.json');
        let versionData: Record<string, unknown> = {
          version: "1.1.0",
          updateUrl: "https://ais-pre-imufz5jbfygi72mp53f7ga-119789279212.europe-west2.run.app",
          releaseNotes: "تحديث جديد يتضمن تحسينات وميزات إضافية.",
          timestamp: buildTimestamp
        };
        try {
          if (fs.existsSync(versionFile)) {
            versionData = { ...versionData, ...JSON.parse(fs.readFileSync(versionFile, 'utf-8')), timestamp: buildTimestamp };
          }
        } catch {}
        
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify(versionData, null, 2)
        });
        
        // Dynamic version injection into Service Worker to force instant cache invalidation on new deploys
        const swFile = path.join(publicDir, 'sw.js');
        if (fs.existsSync(swFile)) {
          let swContent = fs.readFileSync(swFile, 'utf-8');
          swContent = swContent.replace(
            /const CACHE_NAME = ['"][^'"]+['"];/,
            `const CACHE_NAME = 'anis-al-qulub-app-v${buildTimestamp}';`
          );
          swContent = swContent.replace(
            /const RUNTIME_CACHE = ['"][^'"]+['"];/,
            `const RUNTIME_CACHE = 'anis-al-qulub-runtime-v${buildTimestamp}';`
          );
          this.emitFile({
            type: 'asset',
            fileName: 'sw.js',
            source: swContent
          });
        }
        
        const emittedFiles = Object.keys(bundle).map((fileName) => '/' + fileName);
        
        let publicFiles: string[] = [];
        if (fs.existsSync(publicDir)) {
          try {
            publicFiles = getFilesRecursively(publicDir, publicDir);
          } catch {}
        }
        
        // Ensure unique list and specific base files
        const allAssets = new Set([
          '/',
          '/index.html',
          ...publicFiles,
          ...emittedFiles
        ]);
        
        // Remove sw.js to prevent caching itself, and build-assets.json to avoid loop caching
        allAssets.delete('/sw.js');
        allAssets.delete('/build-assets.json');

        const manifestList = Array.from(allAssets);
        
        this.emitFile({
          type: 'asset',
          fileName: 'build-assets.json',
          source: JSON.stringify(manifestList, null, 2)
        });
      } catch (err) {
        console.warn('[versionGeneratorPlugin] Skipping asset manifest emission during build:', err);
      }
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true
      },
      plugins: [
        react(),
        versionGeneratorPlugin()
      ],
      define: {
        '__APP_VERSION__': JSON.stringify(JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')).version || '1.1.0'),
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.VITE_SUPABASE_DATABASE_URL || env.SUPABASE_URL || ''),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.VITE_SUPABASE_DATABASE_URL || env.SUPABASE_URL || ''),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '')
      },
      assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf', '**/*.mp3', '**/*.wav', '**/*.ogg', '**/*.svg', '**/*.json'],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
        dedupe: ['react', 'react-dom']
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'framer-motion',
          'lucide-react',
          '@google/genai',
          '@supabase/supabase-js',
          'adhan'
        ]
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        chunkSizeWarningLimit: 1500,
        assetsInlineLimit: 4096,
        cssCodeSplit: true,
        minify: 'esbuild',
        target: ['es2017', 'chrome60'],
        cssTarget: ['chrome60'],
        rollupOptions: {
          output: {
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash][extname]',
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler/')) {
                  return 'vendor-react';
                }
                if (id.includes('framer-motion')) {
                  return 'vendor-motion';
                }
                if (id.includes('lucide-react')) {
                  return 'vendor-icons';
                }
                if (id.includes('recharts') || id.includes('d3-')) {
                  return 'vendor-charts';
                }
                if (id.includes('@supabase') || id.includes('dexie')) {
                  return 'vendor-db';
                }
                if (id.includes('@google/genai')) {
                  return 'vendor-ai';
                }
                if (id.includes('adhan')) {
                  return 'vendor-adhan';
                }
                return 'vendor-deps';
              }
              // Bundle all Adhkar, Surahs, Tafsir meta and Islamic knowledge into the core data bundle
              if (id.includes('src/data/') || id.includes('src/quran-platform/data/')) {
                return 'bundle-islamic-core-data';
              }
            }
          }
        }
      }
    };
});
