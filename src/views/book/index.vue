<template>
  <div class="book-list-container">
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="书名">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入书名"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="作者">
          <el-input
            v-model="queryParams.author"
            placeholder="请输入作者"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="queryParams.category" placeholder="请选择分类" clearable style="width: 160px">
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 140px">
            <el-option label="可借阅" value="可借阅" />
            <el-option label="已借出" value="已借出" />
            <el-option label="已预约" value="已预约" />
            <el-option label="已丢失" value="已丢失" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" v-auth-btn="'book:add'" @click="handleAdd">
            新增图书
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="selectedIds.length === 0"
            v-auth-btn="'book:delete'"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
          <el-button type="success" :icon="Download" v-auth-btn="'book:export'" @click="handleExport">
            导出Excel
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Refresh" circle @click="getList" />
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column :resizable="false" type="selection" width="50" align="center" />
        <el-table-column :resizable="false" type="index" label="序号" width="55" align="center" />
        <el-table-column :resizable="false" prop="title" label="书名" min-width="150" show-overflow-tooltip />
        <el-table-column :resizable="false" prop="author" label="作者" width="90" show-overflow-tooltip />
        <el-table-column :resizable="false" prop="category" label="分类" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getCategoryTagType(row.category)" size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :resizable="false" prop="price" label="价格" width="80" align="right">
          <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column :resizable="false" label="库存" width="90" align="center">
          <template #default="{ row }">
            {{ row.availableCopies }}/{{ row.totalCopies }}
          </template>
        </el-table-column>
        <el-table-column :resizable="false" prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :resizable="false" prop="location" label="馆藏位置" width="100" show-overflow-tooltip />
        <el-table-column :resizable="false" label="操作" width="170" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
              <el-button type="primary" link size="small" v-auth-btn="'book:edit'" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" v-auth-btn="'book:delete'" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <book-form
      v-model:visible="dialogVisible"
      :form-data="currentRow"
      :is-edit="isEdit"
      @success="getList"
    />
  </div>
</template>

<script setup lang="ts">
// 图书列表页，查询分页、新增编辑、删除、导出都在这儿
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type TableInstance } from 'element-plus'
import { Search, Refresh, Plus, Delete, Download } from '@element-plus/icons-vue'
import { getBookList, deleteBook, batchDeleteBooks } from '@/apis/request'
import { exportToExcel, translateEnum } from '@/utils'
import type { Book, BookQueryParams } from '@/types'
import BookForm from '@/components/BookForm.vue'

const tableRef = ref<TableInstance>()
const loading = ref(false)
const tableData = ref<Book[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])

// isEdit 决定弹窗里的表单是新增还是编辑
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentRow = ref<Book | null>(null)

const categoryOptions = ['文学', '科学', '技术', '历史', '教育', '艺术', '经济', '其他']

const queryParams = reactive<BookQueryParams>({
  pageNum: 1,
  pageSize: 10,
  title: '',
  author: '',
  category: '',
  status: ''
})

// 分类和状态在表格里各给一个 tag 颜色
function getCategoryTagType(category: string): string {
  const map: Record<string, string> = {
    '文学': '', '科学': 'success', '技术': 'primary',
    '历史': 'warning', '教育': 'info', '艺术': 'danger',
    '经济': 'warning', '其他': 'info'
  }
  return map[category] || 'info'
}

function getStatusTagType(status: string): string {
  const map: Record<string, string> = {
    '可借阅': 'success', '已借出': 'warning', '已预约': 'primary', '已丢失': 'danger'
  }
  return map[status] || 'info'
}

async function getList() {
  loading.value = true
  try {
    const res: any = await getBookList(queryParams)
    if (res.code === 200) {
      tableData.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.title = ''
  queryParams.author = ''
  queryParams.category = ''
  queryParams.status = ''
  queryParams.pageNum = 1
  getList()
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size
  getList()
}

function handleCurrentChange(page: number) {
  queryParams.pageNum = page
  getList()
}

function handleSelectionChange(selection: Book[]) {
  selectedIds.value = selection.map((item) => item.id)
}

function handleAdd() {
  isEdit.value = false
  currentRow.value = null
  dialogVisible.value = true
}

function handleEdit(row: Book) {
  isEdit.value = true
  currentRow.value = { ...row }
  dialogVisible.value = true
}

// 详情开在新标签页，这样列表的筛选和分页不会被重置
function handleDetail(row: Book) {
  window.open(`/book/detail/${row.id}`, '_blank')
}

// 删除前先确认，用户点取消会进 catch，什么都不做
async function handleDelete(row: Book) {
  try {
    await ElMessageBox.confirm(
      `确定要删除图书《${row.title}》吗？删除后不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    const res: any = await deleteBook(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getList()
    }
  } catch {
    // 用户取消
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的记录')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条图书记录吗？删除后不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    const res: any = await batchDeleteBooks(selectedIds.value)
    if (res.code === 200) {
      ElMessage.success(res.message || '批量删除成功')
      tableRef.value?.clearSelection()
      getList()
    }
  } catch {
    // 用户取消
  }
}

// 导出直接拿当前页的数据，不另外发请求
function handleExport() {
  if (tableData.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  exportToExcel(tableData.value, {
    filename: `图书列表_${new Date().toISOString().slice(0, 10)}`,
    sheetName: '图书列表',
    columns: [
      { key: 'isbn', label: 'ISBN' },
      { key: 'title', label: '书名' },
      { key: 'author', label: '作者' },
      { key: 'publisher', label: '出版社' },
      { key: 'category', label: '分类' },
      { key: 'price', label: '价格(元)' },
      { key: 'totalCopies', label: '总库存' },
      { key: 'availableCopies', label: '可借数量' },
      { key: 'status', label: '状态' },
      { key: 'location', label: '馆藏位置' },
      { key: 'createTime', label: '创建时间' }
    ],
    transform: (row) => ({
      ...row,
      status: translateEnum(row.status, { '可借阅': '可借阅', '已借出': '已借出', '已预约': '已预约', '已丢失': '已丢失' })
    })
  })
  ElMessage.success('导出成功')
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.book-list-container {
  padding: 0;
}

.search-card {
  margin-bottom: 16px;
  border: none;
}

.table-card {
  border: none;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.table-actions {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.table-actions .el-button {
  padding: 0 4px;
}

.pagination-area {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
