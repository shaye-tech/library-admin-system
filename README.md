# 校园图书管理系统

> Web前端设计与开发实训大作业 — 基于 Vue3 + Vite + TypeScript + Element Plus 的中后台管理系统

## 项目简介

本项目是一套完整的校园图书管理系统前端，实现了登录鉴权、图书管理、读者管理、角色权限管理（RBAC）等核心业务模块，支持动态路由、按钮级权限控制、数据导出、文件上传下载等功能。

项目采用 Mock 数据层（基于 localStorage），无需后端服务即可完整运行所有功能。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 构建工具 | Vite | ^5.0 |
| 前端框架 | Vue | ^3.4 |
| 开发语言 | TypeScript | ^7.0 |
| UI 组件库 | Element Plus | ^2.5 |
| 路由 | Vue Router | ^4.2 |
| 状态管理 | Pinia | ^2.1 |
| 状态持久化 | pinia-plugin-persistedstate | ^3.2 |
| HTTP 客户端 | Axios | ^1.6 |
| Excel 导出 | xlsx | ^0.18 |
| 图标 | @element-plus/icons-vue | ^2.3 |

## 环境要求

- **Node.js**: >= 16.0.0（推荐 18.x 或 20.x）
- **npm**: >= 8.0.0 或 **pnpm** / **yarn**
- **浏览器**: Chrome 90+ / Edge 90+ / Firefox 88+

## 目录结构

```
codes/
├── public/                      # 静态资源（不经过构建）
│   └── favicon.svg              # 网站图标
├── src/
│   ├── apis/
│   │   └── request.ts           # Axios 封装（请求/响应拦截器）+ 全部接口定义 + Mock 分流
│   ├── assets/
│   │   └── styles/
│   │       └── global.css       # 全局样式
│   ├── components/              # 公共业务组件（弹窗表单，供列表页复用）
│   │   ├── BookForm.vue         # 图书新增/编辑表单
│   │   ├── ReaderForm.vue       # 读者新增/编辑表单
│   │   └── RoleForm.vue         # 角色新增/编辑表单（含权限树）
│   ├── mock/
│   │   └── index.ts             # Mock 数据层（localStorage 持久化 + 接口模拟）
│   ├── router/
│   │   └── index.ts             # 路由实例、静态/动态路由、全局路由守卫、resetRouter
│   ├── stores/
│   │   └── index.ts             # Pinia 状态仓库（useUserStore / usePermissionStore）
│   ├── types/
│   │   └── index.ts             # TypeScript 类型定义（API / 用户 / 图书 / 读者 / 角色）
│   ├── utils/
│   │   ├── authBtn.ts           # 按钮权限自定义指令 v-auth-btn
│   │   └── index.ts             # 通用工具（Token 持久化 / Excel 导出 / 格式化）
│   ├── views/                   # 页面视图
│   │   ├── login/index.vue      # 登录页
│   │   ├── layout/index.vue     # 系统布局（侧边栏 + 头部 + 内容区）
│   │   ├── dashboard/index.vue  # 首页仪表盘
│   │   ├── book/index.vue       # 图书管理列表
│   │   ├── book/detail.vue      # 图书详情（附件上传 + 借阅记录）
│   │   ├── reader/index.vue     # 读者管理列表
│   │   ├── reader/detail.vue    # 读者详情（借阅统计）
│   │   ├── role/index.vue       # 角色权限管理
│   │   └── error/404.vue        # 404 错误页
│   ├── App.vue                  # 根组件
│   ├── main.ts                  # 应用入口
│   └── env.d.ts                 # 类型声明
├── .env.development             # 开发环境变量
├── .env.production              # 生产环境变量
├── .gitignore                   # Git 忽略配置
├── index.html                   # HTML 入口
├── package.json                 # 项目依赖与脚本
├── tsconfig.json                # TypeScript 配置
├── tsconfig.node.json           # Node 环境 TypeScript 配置
├── vite.config.ts               # Vite 配置
├── 启动项目.bat                  # Windows 一键启动脚本（npm install + npm run dev）
├── 构建项目.bat                  # Windows 一键构建脚本（npm install + npm run build）
└── README.md                    # 项目说明文档（本文件）
```

> **目录说明**：为便于阅读与提交，同类文件做了适度合并——接口全部集中在 `apis/request.ts`，状态仓库集中在 `stores/index.ts`，类型集中在 `types/index.ts`，通用工具集中在 `utils/index.ts`，路由守卫写在 `router/index.ts` 内。

## 快速开始

### 1. 安装依赖

```bash
# 进入项目目录
cd codes

# 使用 npm 安装
npm install

# 或使用 pnpm（推荐）
pnpm install

# 或使用 yarn
yarn install
```

### 2. 环境变量配置

项目已内置默认环境变量，可根据需要修改：

**开发环境** (`.env.development`)：
```env
VITE_APP_TITLE=校园图书管理系统
VITE_PORT=5173
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_MOCK=true
```

**生产环境** (`.env.production`)：
```env
VITE_APP_TITLE=校园图书管理系统
VITE_PORT=8080
VITE_API_BASE_URL=https://api.example.com
VITE_USE_MOCK=true
```

> **说明**：`VITE_USE_MOCK=true` 时使用内置 Mock 数据层，无需后端服务即可运行。如需对接真实后端，设置为 `false` 并配置 `VITE_API_BASE_URL`。

### 3. 启动开发服务器

```bash
npm run dev
```

启动成功后，浏览器自动打开 `http://localhost:5173`

### 4. 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 5. 预览生产构建

```bash
npm run preview
```

## 测试账号

| 用户名 | 密码 | 角色 | 权限说明 |
|--------|------|------|----------|
| admin | 123456 | 超级管理员 | 拥有所有权限（图书/读者/角色管理全部权限） |
| librarian | 123456 | 图书管理员 | 图书/读者管理权限，无角色管理权限 |
| user | 123456 | 普通用户 | 仅可查看图书与读者数据 |

> 三个内置账号密码均为 `123456`。登录页"记住我"可勾选，用于演示 Token 持久化效果。

## 核心功能说明

### 1. 登录鉴权与 Token 持久化
- 登录表单校验（用户名/密码格式校验）
- Token 存储于 localStorage，实现状态持久化
- Axios 请求拦截器自动注入 Token
- 响应拦截器统一处理 401 未授权
- 全局路由守卫 `beforeEach` 实现鉴权
- 退出登录清空 Token、用户状态、动态路由

### 2. 图书管理模块
- 图书列表分页展示
- 多条件查询（书名、作者、分类、状态）
- 新增/编辑复用表单组件（弹窗形式）
- 表单校验（ISBN 格式、必填项等）
- 单条删除、批量删除（高危操作确认弹窗）
- 图书详情页（基本信息、附件上传/预览/下载）
- 借阅记录子数据按需加载
- 图书数据 Excel 导出

### 3. 读者管理模块
- 读者列表分页展示
- 多条件筛选（姓名、证号、类型、状态、院系）
- 新增/编辑复用表单组件
- 单条删除、批量删除
- 读者详情页（基本信息、借阅统计）
- 读者数据 Excel 导出

### 4. 角色权限管理（RBAC）
- 角色列表管理（新增/编辑/删除）
- el-tree 树形权限选择
- 权限勾选联动（父子节点联动）
- 权限合法性校验（至少选择一项权限）
- 静态路由与动态路由分离
- `router.addRoute` 动态添加路由
- `resetRouter` 路由重置（退出/切换账号时）
- 按钮级权限控制（自定义指令 `v-auth-btn`）
- 404 路由在动态路由之后追加
- 动态菜单渲染（根据用户权限生成侧边栏）

### 5. 数据导出
- 基于 xlsx 库实现前端 Excel 导出
- 支持枚举值翻译、列宽自适应
- 图书列表、读者列表均支持导出

## 常见问题

### Q: 启动后页面空白？
A: 请检查浏览器控制台是否有报错，确认 Node.js 版本 >= 16，依赖已正确安装。

### Q: 登录后没有菜单？
A: Mock 数据存储在 localStorage 中，如遇异常可在浏览器控制台执行 `localStorage.clear()` 后刷新页面重新初始化。

### Q: 如何对接真实后端？
A: 将 `.env.development` 中 `VITE_USE_MOCK` 改为 `false`，配置 `VITE_API_BASE_URL` 为后端地址，后端接口规范参考 `src/apis/` 目录下的接口定义。

### Q: 构建时提示内存不足？
A: Node.js 16+ 默认内存足够，如遇问题可执行 `NODE_OPTIONS=--max-old-space-size=4096 npm run build`。

## 浏览器兼容性

- Chrome >= 90
- Edge >= 90
- Firefox >= 88
- Safari >= 14

## 许可证

本项目为课程实训作业，仅供学习交流使用。
