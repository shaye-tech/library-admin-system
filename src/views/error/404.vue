<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <p class="error-message">抱歉，您访问的页面不存在</p>
      <p class="error-desc">页面可能已被移除、名称已更改或暂时不可用</p>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 路由没匹配上就落到这个页面
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 100px);
  background: #f0f2f5;
}

.not-found-content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #409eff;
  margin: 0;
  line-height: 1;
}

.error-message {
  font-size: 24px;
  color: #303133;
  margin: 20px 0 10px;
}

.error-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 30px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
