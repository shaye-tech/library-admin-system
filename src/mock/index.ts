// 假后端。数据放 localStorage，刷新不丢，没接后端也能把功能跑通
import type { Book, BorrowRecord, Reader, Role, PermissionNode, UserInfo } from '@/types'
import { generateId } from '@/utils'

const STORAGE_KEYS = {
  BOOKS: 'mock_books',
  READERS: 'mock_readers',
  ROLES: 'mock_roles',
  BORROW_RECORDS: 'mock_borrow_records',
  USERS: 'mock_users',
  INITIALIZED: 'mock_initialized'
}

function getStorage<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key)
  if (data) {
    try {
      return JSON.parse(data) as T
    } catch {
      return defaultValue
    }
  }
  return defaultValue
}

function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// 假装有网络延迟，不然 loading 一闪而过根本看不见
function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

// 第一次打开时灌的初始数据，之后都从 localStorage 读
function initMockData(): void {
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED)) return

  const books: Book[] = [
    {
      id: 1, isbn: '9787020002207', title: '红楼梦', author: '曹雪芹',
      publisher: '人民文学出版社', publishDate: '1996-12-01', category: '文学',
      price: 59.7, totalCopies: 10, availableCopies: 7, status: '可借阅',
      description: '中国古典四大名著之首，以贾、史、王、薛四大家族的兴衰为背景。',
      coverUrl: '', location: 'A区-01-01', createTime: '2026-01-15 10:00:00', updateTime: '2026-01-15 10:00:00'
    },
    {
      id: 2, isbn: '9787020008735', title: '三国演义', author: '罗贯中',
      publisher: '人民文学出版社', publishDate: '1998-05-01', category: '文学',
      price: 48.5, totalCopies: 8, availableCopies: 5, status: '可借阅',
      description: '中国第一部长篇章回体历史演义小说，描写了从东汉末年到西晋初年的历史风云。',
      coverUrl: '', location: 'A区-01-02', createTime: '2026-01-15 10:05:00', updateTime: '2026-01-15 10:05:00'
    },
    {
      id: 3, isbn: '9787115546081', title: 'JavaScript高级程序设计', author: 'Matt Frisbie',
      publisher: '人民邮电出版社', publishDate: '2020-10-01', category: '技术',
      price: 129.0, totalCopies: 15, availableCopies: 12, status: '可借阅',
      description: 'JavaScript经典教程，全面深入地介绍JavaScript语言核心和DOM、BOM等浏览器API。',
      coverUrl: '', location: 'B区-02-01', createTime: '2026-02-01 09:00:00', updateTime: '2026-02-01 09:00:00'
    },
    {
      id: 4, isbn: '9787111681427', title: 'Vue.js设计与实现', author: '霍春阳',
      publisher: '机械工业出版社', publishDate: '2022-04-01', category: '技术',
      price: 99.0, totalCopies: 12, availableCopies: 3, status: '可借阅',
      description: '从框架设计原理出发，深入剖析Vue.js的响应式系统、渲染器、组件化等核心实现。',
      coverUrl: '', location: 'B区-02-03', createTime: '2026-02-10 14:00:00', updateTime: '2026-02-10 14:00:00'
    },
    {
      id: 5, isbn: '9787544253994', title: '百年孤独', author: '加西亚·马尔克斯',
      publisher: '南海出版公司', publishDate: '2011-06-01', category: '文学',
      price: 39.5, totalCopies: 6, availableCopies: 0, status: '已借出',
      description: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。',
      coverUrl: '', location: 'A区-01-05', createTime: '2026-01-20 11:00:00', updateTime: '2026-03-01 08:00:00'
    },
    {
      id: 6, isbn: '9787302557449', title: 'TypeScript入门与实战', author: '钟胜平',
      publisher: '清华大学出版社', publishDate: '2021-01-01', category: '技术',
      price: 79.0, totalCopies: 10, availableCopies: 8, status: '可借阅',
      description: '系统介绍TypeScript语言特性及其在前端工程中的应用实践。',
      coverUrl: '', location: 'B区-02-05', createTime: '2026-02-15 10:00:00', updateTime: '2026-02-15 10:00:00'
    },
    {
      id: 7, isbn: '9787100158626', title: '人类简史', author: '尤瓦尔·赫拉利',
      publisher: '中信出版社', publishDate: '2017-02-01', category: '历史',
      price: 68.0, totalCopies: 8, availableCopies: 6, status: '可借阅',
      description: '从认知革命、农业革命到科学革命，讲述智人如何登上食物链顶端。',
      coverUrl: '', location: 'C区-01-01', createTime: '2026-01-25 09:30:00', updateTime: '2026-01-25 09:30:00'
    },
    {
      id: 8, isbn: '9787111407010', title: '算法导论', author: 'Thomas H.Cormen',
      publisher: '机械工业出版社', publishDate: '2013-01-01', category: '科学',
      price: 128.0, totalCopies: 5, availableCopies: 4, status: '可借阅',
      description: '计算机算法领域的经典教材，全面涵盖算法设计与分析。',
      coverUrl: '', location: 'B区-03-01', createTime: '2026-01-10 08:00:00', updateTime: '2026-01-10 08:00:00'
    }
  ]

  const readers: Reader[] = [
    {
      id: 1, readerNo: '2024001', name: '张三', gender: '男', type: '学生',
      department: '软件学院', phone: '13800138001', email: 'zhangsan@ncu.edu.cn',
      status: '正常', maxBorrowCount: 10, currentBorrowCount: 2,
      registerDate: '2024-09-01', expireDate: '2028-06-30', remark: '软件工程专业',
      createTime: '2024-09-01 09:00:00', updateTime: '2024-09-01 09:00:00'
    },
    {
      id: 2, readerNo: '2024002', name: '李四', gender: '女', type: '学生',
      department: '计算机学院', phone: '13800138002', email: 'lisi@ncu.edu.cn',
      status: '正常', maxBorrowCount: 10, currentBorrowCount: 0,
      registerDate: '2024-09-01', expireDate: '2028-06-30', remark: '',
      createTime: '2024-09-01 09:05:00', updateTime: '2024-09-01 09:05:00'
    },
    {
      id: 3, readerNo: 'T2020001', name: '王老师', gender: '男', type: '教师',
      department: '软件学院', phone: '13900139001', email: 'wang@ncu.edu.cn',
      status: '正常', maxBorrowCount: 20, currentBorrowCount: 5,
      registerDate: '2020-03-01', expireDate: '2030-12-31', remark: '副教授',
      createTime: '2020-03-01 10:00:00', updateTime: '2020-03-01 10:00:00'
    },
    {
      id: 4, readerNo: '2024003', name: '赵六', gender: '男', type: '学生',
      department: '信息工程学院', phone: '13800138003', email: 'zhaoliu@ncu.edu.cn',
      status: '冻结', maxBorrowCount: 10, currentBorrowCount: 3,
      registerDate: '2024-09-01', expireDate: '2028-06-30', remark: '逾期未还冻结',
      createTime: '2024-09-01 09:10:00', updateTime: '2026-03-01 08:00:00'
    },
    {
      id: 5, readerNo: '2023010', name: '孙七', gender: '女', type: '学生',
      department: '软件学院', phone: '13800138005', email: 'sunqi@ncu.edu.cn',
      status: '正常', maxBorrowCount: 10, currentBorrowCount: 1,
      registerDate: '2023-09-01', expireDate: '2027-06-30', remark: '',
      createTime: '2023-09-01 09:00:00', updateTime: '2023-09-01 09:00:00'
    }
  ]

  const roles: Role[] = [
    {
      id: 1, roleName: '超级管理员', roleCode: 'admin', description: '拥有系统所有权限',
      status: '启用', permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      createTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00'
    },
    {
      id: 2, roleName: '图书管理员', roleCode: 'librarian', description: '负责图书和读者管理',
      status: '启用', permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      createTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00'
    },
    {
      id: 3, roleName: '普通用户', roleCode: 'user', description: '仅可查看数据',
      status: '启用', permissionIds: [1, 2, 5],
      createTime: '2026-01-01 00:00:00', updateTime: '2026-01-01 00:00:00'
    }
  ]

  const borrowRecords: BorrowRecord[] = [
    {
      id: 1, bookId: 5, bookTitle: '百年孤独', readerId: 1, readerName: '张三',
      borrowDate: '2026-03-01', dueDate: '2026-03-31', returnDate: null,
      status: '借阅中', renewCount: 0
    },
    {
      id: 2, bookId: 4, bookTitle: 'Vue.js设计与实现', readerId: 3, readerName: '王老师',
      borrowDate: '2026-02-15', dueDate: '2026-03-15', returnDate: '2026-03-10',
      status: '已归还', renewCount: 1
    }
  ]

  const users: UserInfo[] = [
    {
      id: 1, username: 'admin', nickname: '系统管理员', avatar: '',
      role: 'admin', roleId: 1, permissions: ['book:view', 'book:add', 'book:edit', 'book:delete', 'book:export', 'reader:view', 'reader:add', 'reader:edit', 'reader:delete', 'reader:export', 'role:view', 'role:add', 'role:edit', 'role:delete'],
      email: 'admin@library.com', phone: '13800000000', password: '123456'
    },
    {
      id: 2, username: 'librarian', nickname: '图书管理员', avatar: '',
      role: 'librarian', roleId: 2, permissions: ['book:view', 'book:add', 'book:edit', 'book:delete', 'book:export', 'reader:view', 'reader:add', 'reader:edit', 'reader:delete', 'reader:export'],
      email: 'lib@library.com', phone: '13800000001', password: '123456'
    },
    {
      id: 3, username: 'user', nickname: '普通用户', avatar: '',
      role: 'user', roleId: 3, permissions: ['book:view', 'reader:view'],
      email: 'user@library.com', phone: '13800000002', password: '123456'
    }
  ]

  setStorage(STORAGE_KEYS.BOOKS, books)
  setStorage(STORAGE_KEYS.READERS, readers)
  setStorage(STORAGE_KEYS.ROLES, roles)
  setStorage(STORAGE_KEYS.BORROW_RECORDS, borrowRecords)
  setStorage(STORAGE_KEYS.USERS, users)
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true')
}

// 模块一加载就执行，已经初始化过就直接跳过，免得把改过的数据冲掉
initMockData()

// 权限树，角色表单里那棵树用的，父子关系靠 parentId
export const permissionTree: PermissionNode[] = [
  {
    id: 1, parentId: 0, name: '图书管理', code: 'book', type: 'menu', path: '/book', icon: 'Reading', sort: 1,
    children: [
      { id: 2, parentId: 1, name: '图书查看', code: 'book:view', type: 'button', sort: 1 },
      { id: 3, parentId: 1, name: '图书新增', code: 'book:add', type: 'button', sort: 2 },
      { id: 4, parentId: 1, name: '图书编辑', code: 'book:edit', type: 'button', sort: 3 },
      { id: 5, parentId: 1, name: '图书删除', code: 'book:delete', type: 'button', sort: 4 },
      { id: 6, parentId: 1, name: '图书导出', code: 'book:export', type: 'button', sort: 5 }
    ]
  },
  {
    id: 7, parentId: 0, name: '读者管理', code: 'reader', type: 'menu', path: '/reader', icon: 'User', sort: 2,
    children: [
      { id: 8, parentId: 7, name: '读者查看', code: 'reader:view', type: 'button', sort: 1 },
      { id: 9, parentId: 7, name: '读者新增', code: 'reader:add', type: 'button', sort: 2 },
      { id: 10, parentId: 7, name: '读者编辑', code: 'reader:edit', type: 'button', sort: 3 },
      { id: 11, parentId: 7, name: '读者删除', code: 'reader:delete', type: 'button', sort: 4 },
      { id: 12, parentId: 7, name: '读者导出', code: 'reader:export', type: 'button', sort: 5 }
    ]
  },
  {
    id: 13, parentId: 0, name: '角色权限', code: 'role', type: 'menu', path: '/role', icon: 'Lock', sort: 3,
    children: [
      { id: 14, parentId: 13, name: '角色查看', code: 'role:view', type: 'button', sort: 1 },
      { id: 15, parentId: 13, name: '角色管理', code: 'role:edit', type: 'button', sort: 2 }
    ]
  }
]

export const mockService = {
  login(username: string, password: string) {
    const users = getStorage<UserInfo[]>(STORAGE_KEYS.USERS, [])
    const user = users.find((u) => u.username === username)
    if (!user) {
      return delay({ code: 401, message: '用户不存在', data: null })
    }
    if (user.password !== password) {
      return delay({ code: 401, message: '密码错误', data: null })
    }
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).slice(2)}`
    // 密码别往前端传
    const { password: _, ...userInfoWithoutPassword } = user
    return delay({ code: 200, message: '登录成功', data: { token, userInfo: userInfoWithoutPassword } })
  },

  getUserListForManage() {
    const users = getStorage<UserInfo[]>(STORAGE_KEYS.USERS, [])
    return delay({ code: 200, message: 'success', data: users })
  },

  changeUserPassword(userId: number, newPassword: string) {
    const users = getStorage<UserInfo[]>(STORAGE_KEYS.USERS, [])
    const index = users.findIndex((u) => u.id === userId)
    if (index === -1) {
      return delay({ code: 404, message: '用户不存在', data: null })
    }
    users[index].password = newPassword
    setStorage(STORAGE_KEYS.USERS, users)
    return delay({ code: 200, message: '密码修改成功', data: null })
  },

  getBookList(params: any) {
    let books = getStorage<Book[]>(STORAGE_KEYS.BOOKS, [])
    if (params.title) books = books.filter((b) => b.title.includes(params.title))
    if (params.author) books = books.filter((b) => b.author.includes(params.author))
    if (params.category) books = books.filter((b) => b.category === params.category)
    if (params.status) books = books.filter((b) => b.status === params.status)
    const total = books.length
    const start = (params.pageNum - 1) * params.pageSize
    const list = books.slice(start, start + params.pageSize)
    return delay({ code: 200, message: 'success', data: { list, total, pageNum: params.pageNum, pageSize: params.pageSize } })
  },

  getBookDetail(id: number) {
    const books = getStorage<Book[]>(STORAGE_KEYS.BOOKS, [])
    const book = books.find((b) => b.id === id)
    return delay({ code: 200, message: 'success', data: book || null })
  },

  addBook(data: Book) {
    const books = getStorage<Book[]>(STORAGE_KEYS.BOOKS, [])
    const newBook = { ...data, id: generateId(), availableCopies: data.totalCopies, createTime: new Date().toLocaleString(), updateTime: new Date().toLocaleString() }
    books.unshift(newBook)
    setStorage(STORAGE_KEYS.BOOKS, books)
    return delay({ code: 200, message: '新增成功', data: newBook })
  },

  updateBook(data: Book) {
    const books = getStorage<Book[]>(STORAGE_KEYS.BOOKS, [])
    const index = books.findIndex((b) => b.id === data.id)
    if (index > -1) {
      books[index] = { ...books[index], ...data, updateTime: new Date().toLocaleString() }
      setStorage(STORAGE_KEYS.BOOKS, books)
    }
    return delay({ code: 200, message: '更新成功', data: books[index] })
  },

  deleteBook(id: number) {
    let books = getStorage<Book[]>(STORAGE_KEYS.BOOKS, [])
    books = books.filter((b) => b.id !== id)
    setStorage(STORAGE_KEYS.BOOKS, books)
    return delay({ code: 200, message: '删除成功', data: null })
  },

  batchDeleteBooks(ids: number[]) {
    let books = getStorage<Book[]>(STORAGE_KEYS.BOOKS, [])
    books = books.filter((b) => !ids.includes(b.id))
    setStorage(STORAGE_KEYS.BOOKS, books)
    return delay({ code: 200, message: `成功删除${ids.length}条记录`, data: null })
  },

  getBorrowRecords(bookId: number) {
    const records = getStorage<BorrowRecord[]>(STORAGE_KEYS.BORROW_RECORDS, [])
    const list = records.filter((r) => r.bookId === bookId)
    return delay({ code: 200, message: 'success', data: list })
  },

  getReaderBorrowRecords(readerId: number) {
    const records = getStorage<BorrowRecord[]>(STORAGE_KEYS.BORROW_RECORDS, [])
    const list = records.filter((r) => r.readerId === readerId)
    return delay({ code: 200, message: 'success', data: list })
  },

  // 借书，库存、可借数、读者已借数量三边都要检查
  addBorrowRecord(data: { bookId: number; readerId: number; borrowDays: number }) {
    const records = getStorage<BorrowRecord[]>(STORAGE_KEYS.BORROW_RECORDS, [])
    const books = getStorage<Book[]>(STORAGE_KEYS.BOOKS, [])
    const readers = getStorage<Reader[]>(STORAGE_KEYS.READERS, [])

    const book = books.find((b) => b.id === data.bookId)
    const reader = readers.find((r) => r.id === data.readerId)

    if (!book) {
      return delay({ code: 404, message: '图书不存在', data: null })
    }
    if (!reader) {
      return delay({ code: 404, message: '读者不存在', data: null })
    }
    if (book.availableCopies <= 0) {
      return delay({ code: 400, message: '该图书已全部借出，暂无可用库存', data: null })
    }
    if (reader.currentBorrowCount >= reader.maxBorrowCount) {
      return delay({ code: 400, message: '该读者已达最大借阅数量', data: null })
    }

    const borrowDate = new Date()
    const dueDate = new Date(borrowDate.getTime() + data.borrowDays * 24 * 60 * 60 * 1000)

    const newRecord: BorrowRecord = {
      id: generateId(),
      bookId: data.bookId,
      bookTitle: book.title,
      readerId: data.readerId,
      readerName: reader.name,
      borrowDate: borrowDate.toISOString().slice(0, 10),
      dueDate: dueDate.toISOString().slice(0, 10),
      returnDate: null,
      status: '借阅中',
      renewCount: 0
    }

    records.unshift(newRecord)
    setStorage(STORAGE_KEYS.BORROW_RECORDS, records)

    // 库存 -1
    const bookIndex = books.findIndex((b) => b.id === data.bookId)
    if (bookIndex > -1) {
      books[bookIndex].availableCopies -= 1
      setStorage(STORAGE_KEYS.BOOKS, books)
    }

    const readerIndex = readers.findIndex((r) => r.id === data.readerId)
    if (readerIndex > -1) {
      readers[readerIndex].currentBorrowCount += 1
      setStorage(STORAGE_KEYS.READERS, readers)
    }

    return delay({ code: 200, message: '借阅成功', data: newRecord })
  },

  returnBook(recordId: number) {
    const records = getStorage<BorrowRecord[]>(STORAGE_KEYS.BORROW_RECORDS, [])
    const books = getStorage<Book[]>(STORAGE_KEYS.BOOKS, [])
    const readers = getStorage<Reader[]>(STORAGE_KEYS.READERS, [])

    const recordIndex = records.findIndex((r) => r.id === recordId)
    if (recordIndex === -1) {
      return delay({ code: 404, message: '借阅记录不存在', data: null })
    }
    if (records[recordIndex].status === '已归还') {
      return delay({ code: 400, message: '该图书已归还', data: null })
    }

    const record = records[recordIndex]
    record.returnDate = new Date().toISOString().slice(0, 10)
    record.status = '已归还'
    setStorage(STORAGE_KEYS.BORROW_RECORDS, records)

    // 还书是上面借书的反操作，库存加回去、已借数减回去
    const bookIndex = books.findIndex((b) => b.id === record.bookId)
    if (bookIndex > -1) {
      books[bookIndex].availableCopies += 1
      setStorage(STORAGE_KEYS.BOOKS, books)
    }

    const readerIndex = readers.findIndex((r) => r.id === record.readerId)
    if (readerIndex > -1) {
      readers[readerIndex].currentBorrowCount = Math.max(0, readers[readerIndex].currentBorrowCount - 1)
      setStorage(STORAGE_KEYS.READERS, readers)
    }

    return delay({ code: 200, message: '归还成功', data: record })
  },

  getReaderList(params: any) {
    let readers = getStorage<Reader[]>(STORAGE_KEYS.READERS, [])
    if (params.name) readers = readers.filter((r) => r.name.includes(params.name))
    if (params.readerNo) readers = readers.filter((r) => r.readerNo.includes(params.readerNo))
    if (params.type) readers = readers.filter((r) => r.type === params.type)
    if (params.status) readers = readers.filter((r) => r.status === params.status)
    if (params.department) readers = readers.filter((r) => r.department.includes(params.department))
    const total = readers.length
    const start = (params.pageNum - 1) * params.pageSize
    const list = readers.slice(start, start + params.pageSize)
    return delay({ code: 200, message: 'success', data: { list, total, pageNum: params.pageNum, pageSize: params.pageSize } })
  },

  getReaderDetail(id: number) {
    const readers = getStorage<Reader[]>(STORAGE_KEYS.READERS, [])
    const reader = readers.find((r) => r.id === id)
    return delay({ code: 200, message: 'success', data: reader || null })
  },

  addReader(data: Reader) {
    const readers = getStorage<Reader[]>(STORAGE_KEYS.READERS, [])
    const newReader = { ...data, id: generateId(), currentBorrowCount: 0, registerDate: new Date().toISOString().slice(0, 10), createTime: new Date().toLocaleString(), updateTime: new Date().toLocaleString() }
    readers.unshift(newReader)
    setStorage(STORAGE_KEYS.READERS, readers)
    return delay({ code: 200, message: '新增成功', data: newReader })
  },

  updateReader(data: Reader) {
    const readers = getStorage<Reader[]>(STORAGE_KEYS.READERS, [])
    const index = readers.findIndex((r) => r.id === data.id)
    if (index > -1) {
      readers[index] = { ...readers[index], ...data, updateTime: new Date().toLocaleString() }
      setStorage(STORAGE_KEYS.READERS, readers)
    }
    return delay({ code: 200, message: '更新成功', data: readers[index] })
  },

  deleteReader(id: number) {
    let readers = getStorage<Reader[]>(STORAGE_KEYS.READERS, [])
    readers = readers.filter((r) => r.id !== id)
    setStorage(STORAGE_KEYS.READERS, readers)
    return delay({ code: 200, message: '删除成功', data: null })
  },

  batchDeleteReaders(ids: number[]) {
    let readers = getStorage<Reader[]>(STORAGE_KEYS.READERS, [])
    readers = readers.filter((r) => !ids.includes(r.id))
    setStorage(STORAGE_KEYS.READERS, readers)
    return delay({ code: 200, message: `成功删除${ids.length}条记录`, data: null })
  },

  getRoleList(params: any) {
    let roles = getStorage<Role[]>(STORAGE_KEYS.ROLES, [])
    if (params.roleName) roles = roles.filter((r) => r.roleName.includes(params.roleName))
    if (params.roleCode) roles = roles.filter((r) => r.roleCode.includes(params.roleCode))
    if (params.status) roles = roles.filter((r) => r.status === params.status)
    const total = roles.length
    const start = (params.pageNum - 1) * params.pageSize
    const list = roles.slice(start, start + params.pageSize)
    return delay({ code: 200, message: 'success', data: { list, total, pageNum: params.pageNum, pageSize: params.pageSize } })
  },

  getAllRoles() {
    const roles = getStorage<Role[]>(STORAGE_KEYS.ROLES, [])
    return delay({ code: 200, message: 'success', data: roles })
  },

  addRole(data: Role) {
    const roles = getStorage<Role[]>(STORAGE_KEYS.ROLES, [])
    const newRole = { ...data, id: generateId(), createTime: new Date().toLocaleString(), updateTime: new Date().toLocaleString() }
    roles.push(newRole)
    setStorage(STORAGE_KEYS.ROLES, roles)
    return delay({ code: 200, message: '新增成功', data: newRole })
  },

  updateRole(data: Role) {
    const roles = getStorage<Role[]>(STORAGE_KEYS.ROLES, [])
    const index = roles.findIndex((r) => r.id === data.id)
    if (index > -1) {
      roles[index] = { ...roles[index], ...data, updateTime: new Date().toLocaleString() }
      setStorage(STORAGE_KEYS.ROLES, roles)
    }
    return delay({ code: 200, message: '更新成功', data: roles[index] })
  },

  deleteRole(id: number) {
    let roles = getStorage<Role[]>(STORAGE_KEYS.ROLES, [])
    roles = roles.filter((r) => r.id !== id)
    setStorage(STORAGE_KEYS.ROLES, roles)
    return delay({ code: 200, message: '删除成功', data: null })
  },

  getPermissionTree() {
    return delay({ code: 200, message: 'success', data: permissionTree })
  }
}
