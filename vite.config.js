import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/naver-api': {
          target: 'https://openapi.naver.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/naver-api/, ''),
          headers: {
            'X-Naver-Client-Id': env.VITE_NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': env.VITE_NAVER_CLIENT_SECRET,
          },
        },
      },
    },
  }
})
