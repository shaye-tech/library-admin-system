// 全局类型定义，接口返回和几个业务实体都在这儿

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageParams {
  pageNum: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

export interface Book {
  id: number
  isbn: string
  title: string
  author: string
  publisher: string
  publishDate: string
  category: string
  price: number
  totalCopies: number
  availableCopies: number
  status: string
  description: string
  coverUrl: string
  location: string
  createTime: string
  updateTime: string
}

export interface BookQueryParams extends PageParams {
  title?: string
  author?: string
  category?: string
  status?: string
}

export interface BookFormData {
  id?: number
  isbn: string
  title: string
  author: string
  publisher: string
  publishDate: string
  category: string
  price: number
  totalCopies: number
  status: string
  description: string
  coverUrl: string
  location: string
}

export interface BorrowRecord {
  id: number
  bookId: number
  bookTitle: string
  readerId: number
  readerName: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: '借阅中' | '已归还' | '已逾期'
  renewCount: number
}

export interface Reader {
  id: number
  readerNo: string
  name: string
  gender: '男' | '女'
  type: string
  department: string
  phone: string
  email: string
  status: string
  maxBorrowCount: number
  currentBorrowCount: number
  registerDate: string
  expireDate: string
  remark: string
  createTime: string
  updateTime: string
}

export interface ReaderQueryParams extends PageParams {
  name?: string
  readerNo?: string
  type?: string
  status?: string
  department?: string
}

export interface ReaderFormData {
  id?: number
  readerNo: string
  name: string
  gender: '男' | '女'
  type: string
  department: string
  phone: string
  email: string
  status: string
  maxBorrowCount: number
  expireDate: string
  remark: string
}

export interface PermissionNode {
  id: number
  parentId: number
  name: string
  code: string
  type: 'menu' | 'button' | 'api'
  path?: string
  icon?: string
  sort: number
  children?: PermissionNode[]
}

export interface Role {
  id: number
  roleName: string
  roleCode: string
  description: string
  status: '启用' | '禁用'
  permissionIds: number[]
  createTime: string
  updateTime: string
}

export interface RoleQueryParams extends PageParams {
  roleName?: string
  roleCode?: string
  status?: string
}

export interface RoleFormData {
  id?: number
  roleName: string
  roleCode: string
  description: string
  status: '启用' | '禁用'
  permissionIds: number[]
}

// 左侧菜单的类型，字段和路由 meta 基本对得上
export interface RouteMenuItem {
  path: string
  name: string
  component?: string
  redirect?: string
  meta: {
    title: string
    icon?: string
    hidden?: boolean
    keepAlive?: boolean
    permissions?: string[]
  }
  children?: RouteMenuItem[]
}

export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  role: string
  roleId: number
  permissions: string[]
  email?: string
  phone?: string
  password?: string
}

export interface LoginResult {
  token: string
  userInfo: UserInfo
}
