import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
        react()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.VITE_SUPABASE_DATABASE_URL || env.SUPABASE_URL || ''),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '')
      },
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
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                if (id.includes('framer-motion')) return 'vendor-motion';
                if (id.includes('lucide-react')) return 'vendor-icons';
                if (id.includes('@google/genai')) return 'vendor-ai';
                if (id.includes('@supabase')) return 'vendor-db';
                if (id.includes('adhan')) return 'vendor-adhan';
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
