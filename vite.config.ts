import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function versionGeneratorPlugin() {
  return {
    name: 'version-generator-plugin',
    buildStart() {
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const versionFile = path.join(publicDir, 'version.json');
      let existingData: Record<string, unknown> = {};
      try {
        if (fs.existsSync(versionFile)) {
          existingData = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
        }
      } catch {}
      const versionData = {
        version: "1.1.0",
        ...existingData,
        timestamp: Date.now()
      };
      fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
    },
    generateBundle(options: any, bundle: any) {
      const publicDir = path.resolve(__dirname, 'public');
      const versionFile = path.join(publicDir, 'version.json');
      let versionData: Record<string, unknown> = {
        version: "1.1.0",
        timestamp: Date.now()
      };
      try {
        if (fs.existsSync(versionFile)) {
          versionData = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
        }
      } catch {}
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(versionData, null, 2)
      });

      // Generate build-assets.json listing all emitted bundles and chunks for Service Worker precaching
      const emittedFiles = Object.keys(bundle).map((fileName) => '/' + fileName);
      const manifestList = [
        '/',
        '/index.html',
        '/manifest.json',
        '/version.json',
        '/app-icon.svg',
        '/fonts/local-fonts.css',
        ...emittedFiles
      ];
      this.emitFile({
        type: 'asset',
        fileName: 'build-assets.json',
        source: JSON.stringify(manifestList, null, 2)
      });
      try {
        fs.writeFileSync(path.join(publicDir, 'build-assets.json'), JSON.stringify(manifestList, null, 2));
      } catch {}
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
        target: 'es2020',
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
