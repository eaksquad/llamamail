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
      {
        name: 'srcbook-error-reporter',
        transform(src: string, id: string) {
          if (id === '/app/src/main.tsx') {
            return `
              ${src}
              if (process.env.NODE_ENV === 'development') {
                if (import.meta.hot) {
                  import.meta.hot.on('vite:error', (data) => {
                    if (window.parent) {
                      window.parent.postMessage({ type: 'vite:hmr:error', data }, '*');
                    }
                  });
                  import.meta.hot.on('vite:beforeUpdate', (data) => {
                    if (window.parent) {
                      window.parent.postMessage({ type: 'vite:hmr:beforeUpdate', data }, '*');
                    }
                  });
                  import.meta.hot.on('vite:afterUpdate', (data) => {
                    if (window.parent) {
                      window.parent.postMessage({ type: 'vite:hmr:afterUpdate', data }, '*');
                    }
                  });
                }
              }
            `;
          }
          return src;
        }
      }
    ],
    define: {
      // Expose only necessary environment variables
      'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || '')
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
