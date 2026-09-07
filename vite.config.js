import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Поллинг вместо inotify: watcher не зависит от inode/событий файловой
      // системы и корректно ловит перезаписи файла с заменой (иначе HMR-модуль
      // может «застрять» в пустом состоянии после серии правок)
      usePolling: true,
      interval: 300,
    },
    proxy: {
      // 2026-09-14: YouTube-стрим-прокси в dev ходит НА ПРОД: локально
      // player API звонил бы с гейтнутого IP VPS (LOGIN_REQUIRED), а Vercel-IP
      // чистый. Функция обязана быть задеплоена (первый push).
      "/api/yt-proxy": {
        target: "https://syntax-sooty.vercel.app",
        changeOrigin: true,
      },
    },
  },
});
