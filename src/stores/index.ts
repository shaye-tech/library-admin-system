/**
 * 状态管理仓库
 * 包含用户状态（登录、权限）和权限状态（动态路由、菜单）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { UserInfo, LoginParams, RouteMenuItem, PermissionNode } from '@/types'
import { login as loginApi, logout as logoutApi } from '@/apis/request'
import { setToken, removeToken, setUserInfo, removeUserInfo, getToken } from '@/utils'
import { asyncRoutes } from '@/router'

// ==================== 用户 Store ====================
export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const token = ref<string>(getToken() || '')
  const permissions = ref<string[]>([])
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || '')
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  async function login(params: LoginParams) {
    loading.value = true
    try {
      const res: any = await loginApi(params)
      if (res.code === 200) {
        const { token: newToken, userInfo: info } = res.data
        token.value = newToken
        userInfo.value = info
        permissions.value = info.permissions || []
        setToken(newToken)
        setUserInfo(info)
        return true
      }
      throw new Error(res.message || '登录失败')
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 忽略退出接口错误
    } finally {
      token.value = ''
      userInfo.value = null
      permissions.value = []
      removeToken()
      removeUserInfo()
    }
  }

  function resetState() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    removeToken()
    removeUserInfo()
  }

  function setPermissions(perms: string[]) {
    permissions.value = perms
  }

  return {
    userInfo, token, permissions, loading,
    isLoggedIn, userRole, isAdmin,
    login, logout, resetState, setPermissions
  }
}, {
  persist: {
    key: 'library_user_store',
    storage: localStorage,
    paths: ['userInfo', 'token', 'permissions']
  }
})

// ==================== 权限 Store ====================
export const usePermissionStore = defineStore('permission', () => {
  const dynamicRoutes = ref<RouteRecordRaw[]>([])
  const menuList = ref<RouteMenuItem[]>([])
  const permissionTree = ref<PermissionNode[]>([])
  const routesLoaded = ref(false)

  function generateRoutes(permissions: string[]): RouteRecordRaw[] {
    return filterAsyncRoutes(asyncRoutes, permissions)
  }

  function filterAsyncRoutes(routes: RouteRecordRaw[], permissions: string[]): RouteRecordRaw[] {
    const result: RouteRecordRaw[] = []
    routes.forEach((route) => {
      const tmp = { ...route }
      if (hasPermission(permissions, tmp)) {
        if (tmp.children) {
          tmp.children = filterAsyncRoutes(tmp.children, permissions)
        }
        result.push(tmp)
      }
    })
    return result
  }

  function hasPermission(permissions: string[], route: RouteRecordRaw): boolean {
    const routePermissions = (route.meta as any)?.permissions as string[] | undefined
    if (!routePermissions || routePermissions.length === 0) {
      return true
    }
    if (permissions.includes('*')) {
      return true
    }
    return routePermissions.some((perm) => permissions.includes(perm))
  }

  function generateMenuList(routes: RouteRecordRaw[]) {
    const menus: RouteMenuItem[] = []
    routes.forEach((route) => {
      if (!(route.meta as any)?.hidden) {
        const menu: RouteMenuItem = {
          path: route.path,
          name: route.name as string,
          meta: {
            title: (route.meta as any)?.title || '',
            icon: (route.meta as any)?.icon || ''
          },
          children: route.children ? route.children
            .filter((child) => !(child.meta as any)?.hidden)
            .map((child) => ({
              path: child.path,
              name: child.name as string,
              meta: {
                title: (child.meta as any)?.title || '',
                icon: (child.meta as any)?.icon || ''
              }
            })) : undefined
        }
        menus.push(menu)
      }
    })
    menuList.value = menus
  }

  function setDynamicRoutes(routes: RouteRecordRaw[]) {
    dynamicRoutes.value = routes
    routesLoaded.value = true
  }

  function resetPermission() {
    dynamicRoutes.value = []
    menuList.value = []
    permissionTree.value = []
    routesLoaded.value = false
  }

  return {
    dynamicRoutes, menuList, permissionTree, routesLoaded,
    generateRoutes, filterAsyncRoutes, hasPermission,
    generateMenuList, setDynamicRoutes, resetPermission
  }
})
