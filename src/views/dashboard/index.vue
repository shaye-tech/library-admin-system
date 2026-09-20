<template>
  <div class="dashboard-container">
    <el-card class="welcome-card" shadow="never">
      <div class="welcome-content">
        <div>
          <h2>欢迎回来，{{ userStore.userInfo?.nickname || '用户' }}！</h2>
          <p>今天是 {{ currentDate }}，祝您工作愉快。</p>
        </div>
        <el-icon :size="64" color="#409eff"><Reading /></el-icon>
      </div>
    </el-card>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">图书总数</p>
              <p class="stat-value">{{ stats.bookTotal }}</p>
            </div>
            <div class="stat-icon icon-blue">
              <el-icon :size="32"><Reading /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">读者总数</p>
              <p class="stat-value">{{ stats.readerTotal }}</p>
            </div>
            <div class="stat-icon icon-green">
              <el-icon :size="32"><User /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">可借阅图书</p>
              <p class="stat-value">{{ stats.availableBooks }}</p>
            </div>
            <div class="stat-icon icon-orange">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">角色数量</p>
              <p class="stat-value">{{ stats.roleTotal }}</p>
            </div>
            <div class="stat-icon icon-purple">
              <el-icon :size="32"><Lock /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="quick-card" shadow="never">
      <template #header>
        <span>快捷操作</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="quick-item" @click="$router.push('/book/index')">
            <el-icon :size="40" color="#409eff"><Reading /></el-icon>
            <span>图书管理</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="quick-item" @click="$router.push('/reader/index')">
            <el-icon :size="40" color="#67c23a"><User /></el-icon>
            <span>读者管理</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="quick-item" @click="$router.push('/role/index')">
            <el-icon :size="40" color="#909399"><Lock /></el-icon>
            <span>角色权限</span>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 首页，四个统计数字加一排快捷入口
import { ref, onMounted } from 'vue'
import { Reading, User, CircleCheck, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { getBookList } from '@/apis/request'
import { getReaderList } from '@/apis/request'
import { getRoleList } from '@/apis/request'

const userStore = useUserStore()

const currentDate = ref('')

const stats = ref({
  bookTotal: 0,
  readerTotal: 0,
  availableBooks: 0,
  roleTotal: 0
})

// 三个模块一起发请求，pageSize 给大值是因为 Mock 里没有专门的总数接口
async function loadStats() {
  try {
    const [bookRes, readerRes, roleRes]: any = await Promise.all([
      getBookList({ pageNum: 1, pageSize: 1000 }),
      getReaderList({ pageNum: 1, pageSize: 1000 }),
      getRoleList({ pageNum: 1, pageSize: 1000 })
    ])
    if (bookRes.code === 200) {
      stats.value.bookTotal = bookRes.data.total
      stats.value.availableBooks = bookRes.data.list.filter(
        (b: any) => b.status === '可借阅'
      ).length
    }
    if (readerRes.code === 200) {
      stats.value.readerTotal = readerRes.data.total
    }
    if (roleRes.code === 200) {
      stats.value.roleTotal = roleRes.data.total
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(() => {
  const now = new Date()
  currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  loadStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: 0;
}

.welcome-card {
  margin-bottom: 20px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.welcome-card :deep(.el-card__body) {
  padding: 24px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}

.welcome-content h2 {
  margin: 0 0 8px;
  font-size: 22px;
}

.welcome-content p {
  margin: 0;
  opacity: 0.9;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  margin: 0 0 8px;
  font-size: 14px;
  color: #909399;
}

.stat-value {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.icon-blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.icon-green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.icon-orange { background: linear-gradient(135deg, #f093fb, #f5576c); }
.icon-purple { background: linear-gradient(135deg, #4facfe, #00f2fe); }

.quick-card {
  border: none;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-item:hover {
  background: #f5f7fa;
  transform: translateY(-2px);
}

.quick-item span {
  font-size: 14px;
  color: #606266;
}
</style>
