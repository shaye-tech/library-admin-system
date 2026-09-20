// 按钮权限指令，用法 <el-button v-auth-btn="'book:add'">。没权限就把元素摘掉
import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores'

function checkPermission(permissionCode: string): boolean {
  const userStore = useUserStore()
  const permissions = userStore.permissions || []
  // 超管不用逐个比对权限码
  if (userStore.userInfo?.role === 'admin') {
    return true
  }
  return permissions.includes(permissionCode)
}

export const authBtn: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    if (value && typeof value === 'string') {
      if (!checkPermission(value)) {
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

export function setupAuthDirective(app: any): void {
  app.directive('auth-btn', authBtn)
}
