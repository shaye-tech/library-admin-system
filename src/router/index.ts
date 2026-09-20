// 路由表 + 登录鉴权守卫
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import Layout from '@/views/layout/index.vue'
import { useUserStore, usePermissionStore } from '@/stores'
import { getToken } from '@/utils'

// 不用校验权限的路由，登录页和主布局都在这里
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

// 要按权限挂载的路由，守卫里 addRoute 上去，path 和 meta.permissions 是对应的
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

// 404 先不挂上去，等动态路由加完了再挂，不然它会把后面的路由都吃掉
export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/error/404.vue'),
  meta: { title: '404', hidden: true }
}

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 })
})

// 动态路由挂没挂上的标记，守卫靠它判断要不要重新挂一次
export let routeLoaded = false

export function setRouteLoaded(val: boolean): void {
  routeLoaded = val
}

export function resetRouteLoaded(): void {
  routeLoaded = false
}

// 退出登录要把动态路由清掉，vue-router 没有提供移除路由的接口，
// 只能另建一个实例，拿它的 matcher 把当前这个覆盖掉
export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHistory(),
    routes: constantRoutes
  })
  ;(router as any).matcher = (newRouter as any).matcher
}

export function addNotFoundRoute() {
  if (!router.hasRoute('NotFound')) {
    router.addRoute(notFoundRoute)
  }
}

// 没登录就赶去登录页；登录了但动态路由还没挂，先挂上再重新导航一次
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
