import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Vite 配置文件
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        // 配置 @ 指向 src 目录
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: Number(env.VITE_PORT) || 5173,
      open: true,
      host: '0.0.0.0',
      proxy: {
        // 开发环境 API 代理配置
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // 分包策略：将第三方库单独打包
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            'element-plus': ['element-plus', '@element-plus/icons-vue'],
            xlsx: ['xlsx']
          }
        }
      }
    }
  }
})
