<template>
  <div class="book-detail-container" v-loading="loading">
    <div class="detail-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回列表</el-button>
      <h2 class="detail-title">图书详情</h2>
    </div>

    <template v-if="bookInfo">
      <el-card class="info-card" shadow="never">
        <template #header>
          <span class="card-title">基本信息</span>
        </template>
        <div class="info-content">
          <div class="book-cover">
            <el-image
              v-if="bookInfo.coverUrl"
              :src="bookInfo.coverUrl"
              fit="cover"
              class="cover-image"
            />
            <div v-else class="cover-placeholder">
              <el-icon :size="64" color="#c0c4cc"><Reading /></el-icon>
              <span>暂无封面</span>
            </div>
            <el-upload
              class="cover-upload"
              :show-file-list="false"
              :before-upload="beforeCoverUpload"
              :http-request="handleCoverUpload"
              accept="image/*"
            >
              <el-button size="small" type="primary" plain>
                <el-icon><Upload /></el-icon>上传封面
              </el-button>
            </el-upload>
          </div>

          <el-descriptions :column="2" border class="info-descriptions">
            <el-descriptions-item label="书名">{{ bookInfo.title }}</el-descriptions-item>
            <el-descriptions-item label="ISBN">{{ bookInfo.isbn }}</el-descriptions-item>
            <el-descriptions-item label="作者">{{ bookInfo.author }}</el-descriptions-item>
            <el-descriptions-item label="出版社">{{ bookInfo.publisher }}</el-descriptions-item>
            <el-descriptions-item label="出版日期">{{ bookInfo.publishDate }}</el-descriptions-item>
            <el-descriptions-item label="分类">
              <el-tag size="small">{{ bookInfo.category }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="价格">¥{{ bookInfo.price.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="馆藏位置">{{ bookInfo.location }}</el-descriptions-item>
            <el-descriptions-item label="总库存">{{ bookInfo.totalCopies }} 册</el-descriptions-item>
            <el-descriptions-item label="可借数量">{{ bookInfo.availableCopies }} 册</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="bookInfo.status === '可借阅' ? 'success' : 'warning'" size="small">
                {{ bookInfo.status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ bookInfo.updateTime }}</el-descriptions-item>
            <el-descriptions-item label="简介" :span="2">{{ bookInfo.description }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <el-card class="attachment-card" shadow="never">
        <template #header>
          <div class="card-header-with-action">
            <span class="card-title">附件资料</span>
            <el-upload
              :show-file-list="false"
              :before-upload="beforeFileUpload"
              :http-request="handleFileUpload"
            >
              <el-button size="small" type="primary" plain>
                <el-icon><Upload /></el-icon>上传附件
              </el-button>
            </el-upload>
          </div>
        </template>
        <el-table :data="attachments" border>
          <el-table-column prop="name" label="文件名" min-width="200" />
          <el-table-column prop="size" label="大小" width="120" align="center">
            <template #default="{ row }">{{ formatFileSize(row.size) }}</template>
          </el-table-column>
          <el-table-column prop="uploadTime" label="上传时间" width="180" align="center" />
          <el-table-column label="操作" width="180" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handlePreview(row)">预览</el-button>
              <el-button type="success" link size="small" @click="handleDownload(row)">下载</el-button>
              <el-button type="danger" link size="small" @click="handleDeleteAttachment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 借阅记录走的是另一个接口，和详情一起拉 -->
      <el-card class="record-card" shadow="never">
        <template #header>
          <div class="card-header-with-action">
            <span class="card-title">借阅记录</span>
            <el-button size="small" type="primary" plain @click="loadBorrowRecords">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </template>
        <el-table :data="borrowRecords" border v-loading="recordLoading">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="readerName" label="借阅人" width="120" />
          <el-table-column prop="borrowDate" label="借阅日期" width="120" align="center" />
          <el-table-column prop="dueDate" label="应还日期" width="120" align="center" />
          <el-table-column prop="returnDate" label="归还日期" width="120" align="center">
            <template #default="{ row }">{{ row.returnDate || '未归还' }}</template>
          </el-table-column>
          <el-table-column prop="renewCount" label="续借次数" width="100" align="center" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '已归还' ? 'success' : row.status === '已逾期' ? 'danger' : 'warning'" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                :disabled="row.status === '已归还'"
                @click="handleReturn(row)"
              >归还</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="borrowRecords.length === 0 && !recordLoading" description="暂无借阅记录" />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
// 图书详情页。附件里那两个示例 pdf/word 是前端临时拼出来的，没走后端
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Reading, Upload, Refresh } from '@element-plus/icons-vue'
import { getBookDetail, getBorrowRecords, returnBook } from '@/apis/request'
import { formatFileSize } from '@/utils'
import type { Book, BorrowRecord } from '@/types'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const recordLoading = ref(false)

const bookInfo = ref<Book | null>(null)

const borrowRecords = ref<BorrowRecord[]>([])

// content 存的是真实 Blob，预览和下载才有东西可用
interface AttachmentItem {
  name: string
  size: number
  uploadTime: string
  mimeType: string
  content: Blob
}

// 手写一份最小结构的 PDF，省得为了演示附件再引一个库
function generateSamplePDF(title: string, content: string): Blob {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT /F2 20 Tf 72 780 Td (${title}) Tj ET
BT /F1 12 Tf 72 740 Td (${content}) Tj ET
BT /F1 10 Tf 72 700 Td (Generated by Library Management System) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000490 00000 n 
0000000559 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
635
%%EOF`
  return new Blob([pdfContent], { type: 'application/pdf' })
}

// Word 同样拼一段 HTML 存成 .doc，Word 能直接打开
function generateSampleWord(title: string, content: string): Blob {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
body { font-family: "SimSun", serif; font-size: 14px; line-height: 1.8; }
h1 { font-size: 22px; text-align: center; color: #333; }
p { text-indent: 2em; margin: 10px 0; }
.footer { text-align: right; color: #999; font-size: 12px; margin-top: 40px; }
</style>
</head>
<body>
<h1>${title}</h1>
<p>${content}</p>
<p>本文档由校园图书管理系统生成，用于附件功能演示。</p>
<div class="footer">生成时间：${new Date().toLocaleString()}</div>
</body>
</html>`
  return new Blob(['\ufeff', html], { type: 'application/msword' })
}

const attachments = ref<AttachmentItem[]>([
  {
    name: '图书简介.pdf',
    size: 204800,
    uploadTime: '2026-01-15 10:30:00',
    mimeType: 'application/pdf',
    content: generateSamplePDF('Book Introduction', 'This is a sample PDF file for book introduction.')
  },
  {
    name: '作者介绍.doc',
    size: 51200,
    uploadTime: '2026-01-15 10:35:00',
    mimeType: 'application/msword',
    content: generateSampleWord('作者介绍', '这是一份关于本书作者的详细介绍文档，包含作者生平、主要作品、创作风格等内容。')
  }
])

function goBack() {
  router.push('/book/index')
}

async function loadBookDetail() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const res: any = await getBookDetail(id)
    if (res.code === 200) {
      bookInfo.value = res.data
    }
  } finally {
    loading.value = false
  }
}

async function loadBorrowRecords() {
  const id = Number(route.params.id)
  if (!id) return
  recordLoading.value = true
  try {
    const res: any = await getBorrowRecords(id)
    if (res.code === 200) {
      borrowRecords.value = res.data
    }
  } finally {
    recordLoading.value = false
  }
}

// 归还完库存和借阅记录都变了，两个都要重新拉一次
async function handleReturn(row: BorrowRecord) {
  try {
    await ElMessageBox.confirm(
      `确定要归还图书《${row.bookTitle}》吗？`,
      '归还确认',
      { confirmButtonText: '确定归还', cancelButtonText: '取消', type: 'info' }
    )
    const res: any = await returnBook(row.id)
    if (res.code === 200) {
      ElMessage.success('归还成功')
      loadBorrowRecords()
      loadBookDetail()
    }
  } catch {
    // 用户取消
  }
}

// 封面只收图片，且不超过 5MB
function beforeCoverUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

function handleCoverUpload(options: any) {
  // 没有后端，读成 base64 直接显示
  const reader = new FileReader()
  reader.onload = (e) => {
    if (bookInfo.value) {
      bookInfo.value.coverUrl = e.target?.result as string
    }
    ElMessage.success('封面上传成功')
  }
  reader.readAsDataURL(options.file)
}

// 附件比封面宽松，放到 20MB
function beforeFileUpload(file: File) {
  const isLt20M = file.size / 1024 / 1024 < 20
  if (!isLt20M) {
    ElMessage.error('文件大小不能超过 20MB!')
    return false
  }
  return true
}

function handleFileUpload(options: any) {
  const file = options.file
  attachments.value.push({
    name: file.name,
    size: file.size,
    uploadTime: new Date().toLocaleString(),
    mimeType: file.type || 'application/octet-stream',
    content: file
  })
  ElMessage.success('附件上传成功')
}

function handlePreview(row: AttachmentItem) {
  if (row.mimeType === 'application/pdf' || row.name.toLowerCase().endsWith('.pdf')) {
    const blobUrl = URL.createObjectURL(row.content)
    window.open(blobUrl, '_blank')
    // 新窗口把文件加载完要点时间，revoke 早了会白屏，所以等一分钟
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  } else {
    ElMessageBox.alert(
      '该格式不支持在线预览，请下载后使用对应软件打开查看。',
      '无法预览',
      { confirmButtonText: '确定', type: 'info' }
    )
  }
}

// 造个 a 标签点一下触发下载，文件名保留原来的扩展名
function handleDownload(row: AttachmentItem) {
  const blobUrl = URL.createObjectURL(row.content)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = row.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)
  ElMessage.success('开始下载')
}

async function handleDeleteAttachment(row: AttachmentItem) {
  try {
    await ElMessageBox.confirm(`确定要删除附件《${row.name}》吗？`, '删除确认', {
      type: 'warning'
    })
    const index = attachments.value.findIndex((a) => a.name === row.name)
    if (index > -1) {
      attachments.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadBookDetail()
  loadBorrowRecords()
})
</script>

<style scoped>
.book-detail-container {
  padding: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.info-card,
.attachment-card,
.record-card {
  margin-bottom: 16px;
  border: none;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.card-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-content {
  display: flex;
  gap: 30px;
}

.book-cover {
  flex-shrink: 0;
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.cover-image {
  width: 200px;
  height: 280px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.cover-placeholder {
  width: 200px;
  height: 280px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
}

.info-descriptions {
  flex: 1;
}
</style>
