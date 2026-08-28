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
  },
});
