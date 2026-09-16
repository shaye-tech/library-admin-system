/**
 * 路由配置与全局守卫
 * 包含静态路由、动态路由、404路由、路由鉴权守卫
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import Layout from '@/views/layout/index.vue'
import { useUserStore, usePermissionStore } from '@/stores'
import { getToken } from '@/utils'

// ==================== 静态路由 ====================
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { hidden: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'Home', affix: true }
      }
    ]
  }
]

// ==================== 动态路由 ====================
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/book',
    component: Layout,
    redirect: '/book/index',
    meta: { title: '图书管理', icon: 'Reading', permissions: ['book:view'] },
    children: [
      {
        path: 'index',
        name: 'BookList',
        component: () => import('@/views/book/index.vue'),
        meta: { title: '图书列表', icon: 'Reading', permissions: ['book:view'], keepAlive: true }
      },
      {
        path: 'detail/:id',
        name: 'BookDetail',
        component: () => import('@/views/book/detail.vue'),
        meta: { title: '图书详情', icon: 'Document', hidden: true, permissions: ['book:view'] }
      }
    ]
  },
  {
    path: '/reader',
    component: Layout,
    redirect: '/reader/index',
    meta: { title: '读者管理', icon: 'User', permissions: ['reader:view'] },
    children: [
      {
        path: 'index',
        name: 'ReaderList',
        component: () => import('@/views/reader/index.vue'),
        meta: { title: '读者列表', icon: 'User', permissions: ['reader:view'], keepAlive: true }
      },
      {
        path: 'detail/:id',
        name: 'ReaderDetail',
        component: () => import('@/views/reader/detail.vue'),
        meta: { title: '读者详情', icon: 'Document', hidden: true, permissions: ['reader:view'] }
      }
    ]
  },
  {
    path: '/role',
    component: Layout,
    redirect: '/role/index',
    meta: { title: '角色权限', icon: 'Lock', permissions: ['role:view'] },
    children: [
      {
        path: 'index',
        name: 'RoleList',
        component: () => import('@/views/role/index.vue'),
        meta: { title: '角色管理', icon: 'Lock', permissions: ['role:view'], keepAlive: true }
      }
    ]
  }
]

// ==================== 404 路由 ====================
export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/error/404.vue'),
  meta: { title: '404', hidden: true }
}

// ==================== 创建路由实例 ====================
const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 })
})

// ==================== 路由加载标志 ====================
export let routeLoaded = false

export function setRouteLoaded(val: boolean): void {
  routeLoaded = val
}

export function resetRouteLoaded(): void {
  routeLoaded = false
}

// ==================== 路由重置 ====================
export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHistory(),
    routes: constantRoutes
  })
  ;(router as any).matcher = (newRouter as any).matcher
}

// 动态添加 404 路由
export function addNotFoundRoute() {
  if (!router.hasRoute('NotFound')) {
    router.addRoute(notFoundRoute)
  }
}

// ==================== 全局路由守卫 ====================
const whiteList = ['/login']

router.beforeEach(async (to, from, next) => {
  document.title = (to.meta.title ? `${to.meta.title} - ` : '') + '校园图书管理系统'

  const token = getToken()
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
      return
    }

    if (!userStore.userInfo) {
      try {
        if (!userStore.token) {
          userStore.token = token
        }
      } catch {
        userStore.resetState()
        permissionStore.resetPermission()
        setRouteLoaded(false)
        next(`/login?redirect=${to.path}`)
        return
      }
    }

    if (!routeLoaded || !permissionStore.routesLoaded) {
      try {
        const permissions = userStore.permissions || []
        const accessRoutes = permissionStore.generateRoutes(permissions)

        accessRoutes.forEach((route) => {
          router.addRoute(route)
        })

        if (!router.hasRoute('NotFound')) {
          router.addRoute(notFoundRoute)
        }

        permissionStore.generateMenuList(accessRoutes)
        permissionStore.setDynamicRoutes(accessRoutes)
        setRouteLoaded(true)

        next({ ...to, replace: true })
        return
      } catch (error) {
        console.error('动态路由加载失败:', error)
        ElMessage.error('权限加载失败，请重新登录')
        userStore.resetState()
        permissionStore.resetPermission()
        setRouteLoaded(false)
        next(`/login?redirect=${to.path}`)
        return
      }
    }

    next()
    return
  }

  if (whiteList.includes(to.path)) {
    next()
  } else {
    ElMessage.warning('请先登录')
    next(`/login?redirect=${to.path}`)
  }
})

export default router
