/**
 * 按钮权限自定义指令 v-auth-btn
 * 用法：<el-button v-auth-btn="'book:add'">新增</el-button>
 * 当用户无该按钮权限时，按钮被移除
 */
import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores'

// 检查按钮权限
function checkPermission(permissionCode: string): boolean {
  const userStore = useUserStore()
  const permissions = userStore.permissions || []
  // 超级管理员拥有所有权限
  if (userStore.userInfo?.role === 'admin') {
    return true
  }
  return permissions.includes(permissionCode)
}

// 按钮权限指令定义
export const authBtn: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    if (value && typeof value === 'string') {
      if (!checkPermission(value)) {
        // 无权限时移除元素
        el.parentNode?.removeChild(el)
      }
    } else {
      throw new Error('v-auth-btn 指令需要传入权限标识，如 v-auth-btn="\'book:add\'"')
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    if (value && typeof value === 'string') {
      if (!checkPermission(value)) {
        el.parentNode?.removeChild(el)
      }
    }
  }
}

// 全局注册指令
export function setupAuthDirective(app: any): void {
  app.directive('auth-btn', authBtn)
}
