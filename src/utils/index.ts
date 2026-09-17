/**
 * 通用工具函数
 * 包含ID生成、Token持久化、Excel导出等工具
 */
import * as XLSX from 'xlsx'

// ==================== 通用工具 ====================

export function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// ==================== Token 与用户信息持久化 ====================

const TOKEN_KEY = 'library_admin_token'
const USER_INFO_KEY = 'library_admin_user_info'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUserInfo<T = any>(): T | null {
  const info = localStorage.getItem(USER_INFO_KEY)
  if (info) {
    try {
      return JSON.parse(info) as T
    } catch {
      return null
    }
  }
  return null
}

export function setUserInfo<T = any>(userInfo: T): void {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

export function removeUserInfo(): void {
  localStorage.removeItem(USER_INFO_KEY)
}

// ==================== 枚举翻译 ====================

/**
 * 枚举字典翻译
 * 按映射表把原始值翻译为展示文案，未命中时回退为原值本身，
 * 避免导出/展示时出现 undefined。
 * @param value 原始值，如 row.status
 * @param map   映射字典，如 { '1': '可借阅', '2': '已借出' }
 */
export function translateEnum(
  value: string | number | null | undefined,
  map: Record<string, string>
): string {
  if (value === null || value === undefined) return ''
  const key = String(value)
  return map[key] ?? key
}

// ==================== Excel 导出 ====================

export interface ExportOptions {
  filename: string
  sheetName?: string
  columns: { key: string; label: string }[]
  transform?: (row: Record<string, any>) => Record<string, any>
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): void {
  const { filename, sheetName = 'Sheet1', columns, transform } = options

  const exportData = data.map((row) => {
    const processed = transform ? transform(row) : row
    const result: Record<string, any> = {}
    columns.forEach((col) => {
      result[col.label] = processed[col.key] ?? ''
    })
    return result
  })

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  worksheet['!cols'] = columns.map((col) => ({
    wch: Math.max(col.label.length * 2, 12)
  }))

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
