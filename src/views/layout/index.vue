<template>
  <!-- 系统布局组件：侧边栏 + 顶部导航 + 内容区 -->
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo-area">
        <el-icon :size="28" color="#fff"><Reading /></el-icon>
        <span v-show="!isCollapse" class="logo-text">图书管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <!-- 首页 -->
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <!-- 动态菜单（根据权限渲染） -->
        <template v-for="menu in permissionStore.menuList" :key="menu.path">
          <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
            <template #title>
              <el-icon><component :is="menu.meta.icon || 'Menu'" /></el-icon>
              <span>{{ menu.meta.title }}</span>
            </template>
            <el-menu-item
              v-for="child in menu.children"
              :key="child.path"
              :index="menu.path + '/' + child.path"
            >
              {{ child.meta.title }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path">
            <el-icon><component :is="menu.meta.icon || 'Menu'" /></el-icon>
            <template #title>{{ menu.meta.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <!-- 右侧主区域 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <!-- 折叠按钮 -->
          <el-icon class="collapse-btn" :size="20" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <!-- 面包屑 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title && route.path !== '/dashboard'">
              {{ route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 用户信息 -->
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userStore.userInfo?.nickname || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
/**
 * 系统布局组件
 * 包含侧边栏导航（动态菜单渲染）、顶部导航栏（面包屑、用户信息、退出登录）、内容区
 */
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  House, Reading, Fold, Expand, ArrowDown,
  User, UserFilled, SwitchButton
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { usePermissionStore } from '@/stores'
import { resetRouter, resetRouteLoaded } from '@/router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 切换侧边栏折叠
function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

// 处理用户下拉菜单命令
async function handleCommand(command: string) {
  if (command === 'logout') {
    // 退出登录确认
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      // 执行退出登录
      await userStore.logout()
      // 重置路由（清除动态路由，防止权限残留）
      resetRouter()
      resetRouteLoaded()
      // 重置权限状态
      permissionStore.resetPermission()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
      // 用户取消退出
    }
  } else if (command === 'profile') {
    ElMessage.info('个人中心功能开发中')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #2b3a4f;
  color: #fff;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.layout-aside :deep(.el-menu) {
  border-right: none;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  cursor: pointer;
  color: #606266;
}

.collapse-btn:hover {
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.username {
  font-size: 14px;
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

/* 路由切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
