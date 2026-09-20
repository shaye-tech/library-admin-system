// 应用入口
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'
import { setupAuthDirective } from './utils/authBtn'

import './assets/styles/global.css'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// pinia 和 Element Plus 必须在 router 前面注册，app.use(router) 会立刻触发首次导航并渲染组件
app.use(pinia)
app.use(ElementPlus, { locale: zhCn })

// 图标按名字全局注册，模板里直接写 <el-icon><Home /></el-icon> 就行
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

setupAuthDirective(app)

app.use(router)

// 兜住没被 catch 的错误，方便在控制台定位
window.onerror = function (msg, url, line, col, error) {
  console.error('运行时错误:', msg, url, line, col, error)
  return false
}

window.addEventListener('unhandledrejection', function (event) {
  console.error('未处理的Promise拒绝:', event.reason)
})

app.mount('#app')
