import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env': {},
      'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(
        process.env.VITE_GROQ_API_KEY || env.VITE_GROQ_API_KEY || ''
      ),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            groq: ['groq-sdk']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  };
});
