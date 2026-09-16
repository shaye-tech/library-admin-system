/**
 * 应用入口文件
 * 注册 Vue 应用、Element Plus、Pinia、Vue Router、自定义指令等
 */
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

// 引入全局样式
import './assets/styles/global.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 创建 Pinia 状态管理实例，并注册持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 注册插件（注意顺序：Element Plus 和图标必须在 router 之前注册，
// 因为 app.use(router) 会立即触发初始路由导航并渲染组件）
app.use(pinia)
app.use(ElementPlus, { locale: zhCn })

// 全局注册 Element Plus 图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册按钮权限自定义指令 v-auth-btn
setupAuthDirective(app)

// 最后注册路由（会触发初始路由导航）
app.use(router)

// 全局错误捕获
window.onerror = function (msg, url, line, col, error) {
  console.error('运行时错误:', msg, url, line, col, error)
  return false
}

window.addEventListener('unhandledrejection', function (event) {
  console.error('未处理的Promise拒绝:', event.reason)
})

// 挂载应用
app.mount('#app')
