import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
    ],
    define: {
      // Directly use VITE_ prefixed environment variable
      'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(env.VITE_GROQ_API_KEY || '')
    },
    server: {
      port: 3000,
      strictPort: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
