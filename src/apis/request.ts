/**
 * 网络请求封装与 API 接口
 * 包含 axios 实例、拦截器、Mock 适配、所有业务 API
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from '@/utils'
import { mockService } from '@/mock'
import type {
  ApiResponse, PageResult,
  Book, BookQueryParams, BookFormData, BorrowRecord,
  Reader, ReaderQueryParams, ReaderFormData,
  Role, RoleQueryParams, RoleFormData, PermissionNode,
  LoginParams, UserInfo, LoginResult
} from '@/types'

// 是否启用 Mock 模式
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
})

// ==================== 请求拦截器 ====================
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// ==================== 响应拦截器 ====================
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    // 登录接口错误交给登录页弹窗处理
    const isLoginRequest = response.config.url?.includes('/auth/login')
    if (isLoginRequest && res.code !== 200) {
      return Promise.reject(new Error(res.message || '登录失败'))
    }
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      if (res.code === 401) {
        removeToken()
        window.location.href = '/login'
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    console.error('响应错误:', error)
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          removeToken()
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(error.response.data?.message || `请求错误(${status})`)
      }
    } else if (error.request) {
      ElMessage.error('网络异常，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

// ==================== Mock 请求适配 ====================
async function mockRequest(config: AxiosRequestConfig): Promise<any> {
  const url = config.url || ''
  const method = (config.method || 'get').toLowerCase()
  const data = config.data || {}
  const params = config.params || {}

  // 认证
  if (url.includes('/auth/login') && method === 'post') {
    return mockService.login(data.username, data.password)
  }

  // 用户密码管理
  if (url.includes('/user/manage-list') && method === 'get') {
    return mockService.getUserListForManage()
  }
  if (url.includes('/user/change-password') && method === 'post') {
    return mockService.changeUserPassword(data.userId, data.newPassword)
  }

  // 图书
  if (url.includes('/book/list') && method === 'get') {
    return mockService.getBookList(params)
  }
  if (url.match(/\/book\/\d+$/) && method === 'get') {
    return mockService.getBookDetail(Number(url.split('/').pop()))
  }
  if (url.includes('/book/add') && method === 'post') {
    return mockService.addBook(data)
  }
  if (url.includes('/book/update') && method === 'put') {
    return mockService.updateBook(data)
  }
  if (url.match(/\/book\/\d+$/) && method === 'delete') {
    return mockService.deleteBook(Number(url.split('/').pop()))
  }
  if (url.includes('/book/batch-delete') && method === 'post') {
    return mockService.batchDeleteBooks(data.ids)
  }
  if (url.includes('/book/borrow-records') && method === 'get') {
    return mockService.getBorrowRecords(params.bookId)
  }
  if (url.includes('/reader/borrow-records') && method === 'get') {
    return mockService.getReaderBorrowRecords(params.readerId)
  }
  if (url.includes('/borrow/add') && method === 'post') {
    return mockService.addBorrowRecord(data)
  }
  if (url.includes('/borrow/return') && method === 'post') {
    return mockService.returnBook(data.recordId)
  }

  // 读者
  if (url.includes('/reader/list') && method === 'get') {
    return mockService.getReaderList(params)
  }
  if (url.match(/\/reader\/\d+$/) && method === 'get') {
    return mockService.getReaderDetail(Number(url.split('/').pop()))
  }
  if (url.includes('/reader/add') && method === 'post') {
    return mockService.addReader(data)
  }
  if (url.includes('/reader/update') && method === 'put') {
    return mockService.updateReader(data)
  }
  if (url.match(/\/reader\/\d+$/) && method === 'delete') {
    return mockService.deleteReader(Number(url.split('/').pop()))
  }
  if (url.includes('/reader/batch-delete') && method === 'post') {
    return mockService.batchDeleteReaders(data.ids)
  }

  // 角色
  if (url.includes('/role/list') && method === 'get') {
    return mockService.getRoleList(params)
  }
  if (url.includes('/role/all') && method === 'get') {
    return mockService.getAllRoles()
  }
  if (url.includes('/role/add') && method === 'post') {
    return mockService.addRole(data)
  }
  if (url.includes('/role/update') && method === 'put') {
    return mockService.updateRole(data)
  }
  if (url.match(/\/role\/\d+$/) && method === 'delete') {
    return mockService.deleteRole(Number(url.split('/').pop()))
  }
  if (url.includes('/role/permission-tree') && method === 'get') {
    return mockService.getPermissionTree()
  }

  return { code: 200, message: 'success', data: null }
}

// ==================== 基础请求方法 ====================
export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  if (USE_MOCK) {
    return mockRequest(config) as Promise<T>
  }
  return service(config) as unknown as Promise<T>
}

export function get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, url, method: 'get', params })
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, url, method: 'post', data })
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, url, method: 'put', data })
}

export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, url, method: 'delete' })
}

// ==================== 认证 API ====================
export function login(data: LoginParams): Promise<ApiResponse<LoginResult>> {
  return post<ApiResponse<LoginResult>>('/auth/login', data)
}

export function logout(): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/auth/logout')
}

// ==================== 图书 API ====================
export function getBookList(params: BookQueryParams): Promise<ApiResponse<PageResult<Book>>> {
  return get<ApiResponse<PageResult<Book>>>('/book/list', params)
}

export function getBookDetail(id: number): Promise<ApiResponse<Book>> {
  return get<ApiResponse<Book>>(`/book/${id}`)
}

export function addBook(data: BookFormData): Promise<ApiResponse<Book>> {
  return post<ApiResponse<Book>>('/book/add', data)
}

export function updateBook(data: BookFormData): Promise<ApiResponse<Book>> {
  return put<ApiResponse<Book>>('/book/update', data)
}

export function deleteBook(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/book/${id}`)
}

export function batchDeleteBooks(ids: number[]): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/book/batch-delete', { ids })
}

export function getBorrowRecords(bookId: number): Promise<ApiResponse<BorrowRecord[]>> {
  return get<ApiResponse<BorrowRecord[]>>('/book/borrow-records', { bookId })
}

export function getReaderBorrowRecords(readerId: number): Promise<ApiResponse<BorrowRecord[]>> {
  return get<ApiResponse<BorrowRecord[]>>('/reader/borrow-records', { readerId })
}

export function addBorrowRecord(data: { bookId: number; readerId: number; borrowDays: number }): Promise<ApiResponse<BorrowRecord>> {
  return post<ApiResponse<BorrowRecord>>('/borrow/add', data)
}

export function returnBook(recordId: number): Promise<ApiResponse<BorrowRecord>> {
  return post<ApiResponse<BorrowRecord>>('/borrow/return', { recordId })
}

// ==================== 读者 API ====================
export function getReaderList(params: ReaderQueryParams): Promise<ApiResponse<PageResult<Reader>>> {
  return get<ApiResponse<PageResult<Reader>>>('/reader/list', params)
}

export function getReaderDetail(id: number): Promise<ApiResponse<Reader>> {
  return get<ApiResponse<Reader>>(`/reader/${id}`)
}

export function addReader(data: ReaderFormData): Promise<ApiResponse<Reader>> {
  return post<ApiResponse<Reader>>('/reader/add', data)
}

export function updateReader(data: ReaderFormData): Promise<ApiResponse<Reader>> {
  return put<ApiResponse<Reader>>('/reader/update', data)
}

export function deleteReader(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/reader/${id}`)
}

export function batchDeleteReaders(ids: number[]): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/reader/batch-delete', { ids })
}

// ==================== 角色 API ====================
export function getRoleList(params: RoleQueryParams): Promise<ApiResponse<PageResult<Role>>> {
  return get<ApiResponse<PageResult<Role>>>('/role/list', params)
}

export function getAllRoles(): Promise<ApiResponse<Role[]>> {
  return get<ApiResponse<Role[]>>('/role/all')
}

export function addRole(data: RoleFormData): Promise<ApiResponse<Role>> {
  return post<ApiResponse<Role>>('/role/add', data)
}

export function updateRole(data: RoleFormData): Promise<ApiResponse<Role>> {
  return put<ApiResponse<Role>>('/role/update', data)
}

export function deleteRole(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/role/${id}`)
}

export function getPermissionTree(): Promise<ApiResponse<PermissionNode[]>> {
  return get<ApiResponse<PermissionNode[]>>('/role/permission-tree')
}

// ==================== 用户密码管理 API ====================
export function getUserListForManage(): Promise<ApiResponse<UserInfo[]>> {
  return get<ApiResponse<UserInfo[]>>('/user/manage-list')
}

export function changeUserPassword(data: { userId: number; newPassword: string }): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/user/change-password', data)
}

export default service
