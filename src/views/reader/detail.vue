<template>
  <!-- 读者详情页 -->
  <div class="reader-detail-container" v-loading="loading">
    <div class="detail-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回列表</el-button>
      <h2 class="detail-title">读者详情</h2>
    </div>

    <template v-if="readerInfo">
      <!-- 基本信息 -->
      <el-card class="info-card" shadow="never">
        <template #header><span class="card-title">基本信息</span></template>
        <div class="info-content">
          <!-- 头像 -->
          <div class="reader-avatar">
            <el-avatar :size="100" :icon="UserFilled" />
            <h3 class="reader-name">{{ readerInfo.name }}</h3>
            <el-tag :type="readerInfo.status === '正常' ? 'success' : 'danger'" size="small">
              {{ readerInfo.status }}
            </el-tag>
          </div>
          <!-- 详细信息 -->
          <el-descriptions :column="2" border class="info-descriptions">
            <el-descriptions-item label="读者证号">{{ readerInfo.readerNo }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ readerInfo.gender }}</el-descriptions-item>
            <el-descriptions-item label="读者类型">{{ readerInfo.type }}</el-descriptions-item>
            <el-descriptions-item label="所属院系">{{ readerInfo.department }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ readerInfo.phone }}</el-descriptions-item>
            <el-descriptions-item label="电子邮箱">{{ readerInfo.email }}</el-descriptions-item>
            <el-descriptions-item label="注册日期">{{ readerInfo.registerDate }}</el-descriptions-item>
            <el-descriptions-item label="有效期至">{{ readerInfo.expireDate }}</el-descriptions-item>
            <el-descriptions-item label="最大借阅数">{{ readerInfo.maxBorrowCount }} 册</el-descriptions-item>
            <el-descriptions-item label="当前借阅数">{{ readerInfo.currentBorrowCount }} 册</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ readerInfo.remark || '无' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <!-- 借阅统计 -->
      <el-card class="stat-card" shadow="never">
        <template #header><span class="card-title">借阅统计</span></template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <p class="stat-label">当前借阅</p>
              <p class="stat-value text-primary">{{ readerInfo.currentBorrowCount }}</p>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <p class="stat-label">可借额度</p>
              <p class="stat-value text-success">{{ readerInfo.maxBorrowCount - readerInfo.currentBorrowCount }}</p>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <p class="stat-label">借阅上限</p>
              <p class="stat-value text-warning">{{ readerInfo.maxBorrowCount }}</p>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-area">
        <el-button type="primary" @click="handleEdit">编辑信息</el-button>
        <el-button type="danger" @click="handleDelete">注销读者</el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 读者详情页
 * 展示读者详细信息、借阅统计
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, UserFilled } from '@element-plus/icons-vue'
import { getReaderDetail, deleteReader } from '@/apis/request'
import type { Reader } from '@/types'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const readerInfo = ref<Reader | null>(null)

function goBack() { router.back() }

async function loadDetail() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const res: any = await getReaderDetail(id)
    if (res.code === 200) {
      readerInfo.value = res.data
    }
  } finally {
    loading.value = false
  }
}

function handleEdit() {
  ElMessage.info('请在列表页点击编辑按钮进行修改')
}

async function handleDelete() {
  if (!readerInfo.value) return
  try {
    await ElMessageBox.confirm(
      `确定要注销读者「${readerInfo.value.name}」吗？此操作不可恢复！`,
      '注销确认',
      { confirmButtonText: '确定注销', cancelButtonText: '取消', type: 'warning' }
    )
    const res: any = await deleteReader(readerInfo.value.id)
    if (res.code === 200) {
      ElMessage.success('注销成功')
      router.back()
    }
  } catch { /* 用户取消 */ }
}

onMounted(() => { loadDetail() })
</script>

<style scoped>
.reader-detail-container { padding: 0; }
.detail-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.detail-title { margin: 0; font-size: 20px; color: #303133; }
.info-card, .stat-card { margin-bottom: 16px; border: none; }
.card-title { font-size: 16px; font-weight: 600; }
.info-content { display: flex; gap: 30px; }
.reader-avatar { flex-shrink: 0; width: 150px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.reader-name { margin: 0; font-size: 18px; color: #303133; }
.info-descriptions { flex: 1; }
.stat-item { text-align: center; padding: 20px; }
.stat-label { margin: 0 0 8px; font-size: 14px; color: #909399; }
.stat-value { margin: 0; font-size: 32px; font-weight: 600; }
.text-primary { color: #409eff; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.action-area { display: flex; gap: 16px; justify-content: center; padding: 20px; }
</style>
