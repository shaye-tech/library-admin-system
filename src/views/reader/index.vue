<template>
  <div class="reader-list-container">
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="姓名">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入姓名"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="读者证号">
          <el-input
            v-model="queryParams.readerNo"
            placeholder="请输入证号"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="读者类型">
          <el-select v-model="queryParams.type" placeholder="请选择类型" clearable style="width: 140px">
            <el-option label="学生" value="学生" />
            <el-option label="教师" value="教师" />
            <el-option label="教职工" value="教职工" />
            <el-option label="校外读者" value="校外读者" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="正常" value="正常" />
            <el-option label="冻结" value="冻结" />
            <el-option label="注销" value="注销" />
          </el-select>
        </el-form-item>
        <el-form-item label="院系">
          <el-input
            v-model="queryParams.department"
            placeholder="请输入院系"
            clearable
            style="width: 160px"
            @keyup.enter="handleQuery"
          />
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
          <el-button type="primary" :icon="Plus" v-auth-btn="'reader:add'" @click="handleAdd">
            新增读者
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="selectedIds.length === 0"
            v-auth-btn="'reader:delete'"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
          <el-button type="success" :icon="Download" v-auth-btn="'reader:export'" @click="handleExport">
            导出Excel
          </el-button>
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
        <el-table-column :resizable="false" prop="readerNo" label="读者证号" width="100" />
        <el-table-column :resizable="false" prop="name" label="姓名" width="80" />
        <el-table-column :resizable="false" prop="gender" label="性别" width="60" align="center" />
        <el-table-column :resizable="false" prop="type" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === '教师' ? 'warning' : 'primary'" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :resizable="false" prop="department" label="院系" min-width="110" show-overflow-tooltip />
        <el-table-column :resizable="false" prop="phone" label="联系电话" width="120" />
        <el-table-column :resizable="false" label="借阅" width="80" align="center">
          <template #default="{ row }">
            {{ row.currentBorrowCount }}/{{ row.maxBorrowCount }}
          </template>
        </el-table-column>
        <el-table-column :resizable="false" prop="status" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : row.status === '冻结' ? 'danger' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :resizable="false" label="操作" width="200" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
              <el-button type="success" link size="small" v-auth-btn="'reader:edit'" @click="handleBorrow(row)">借阅</el-button>
              <el-button type="primary" link size="small" v-auth-btn="'reader:edit'" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" v-auth-btn="'reader:delete'" @click="handleDelete(row)">删除</el-button>
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

    <reader-form
      v-model:visible="dialogVisible"
      :form-data="currentRow"
      :is-edit="isEdit"
      @success="getList"
    />

    <el-dialog v-model="borrowDialogVisible" title="图书借阅" width="480px" :close-on-click-modal="false">
      <el-form ref="borrowFormRef" :model="borrowForm" :rules="borrowRules" label-width="90px">
        <el-form-item label="读者姓名">
          <el-input :value="currentReader?.name" disabled />
        </el-form-item>
        <el-form-item label="选择图书" prop="bookId">
          <el-select v-model="borrowForm.bookId" placeholder="请选择要借阅的图书" filterable style="width: 100%">
            <el-option
              v-for="book in availableBooks"
              :key="book.id"
              :label="`${book.title}（可借：${book.availableCopies}）`"
              :value="book.id"
              :disabled="book.availableCopies <= 0"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="借阅天数" prop="borrowDays">
          <el-input-number v-model="borrowForm.borrowDays" :min="1" :max="60" style="width: 100%" />
        </el-form-item>
        <el-form-item label="当前借阅">
          <span>{{ currentReader?.currentBorrowCount }}/{{ currentReader?.maxBorrowCount }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="borrowDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="borrowLoading" @click="submitBorrow">确认借阅</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 读者列表页，除了一般的增删改查，还带个借书弹窗
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type TableInstance, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus, Delete, Download } from '@element-plus/icons-vue'
import { getReaderList, deleteReader, batchDeleteReaders } from '@/apis/request'
import { getBookList, addBorrowRecord } from '@/apis/request'
import { exportToExcel } from '@/utils'
import type { Reader, ReaderQueryParams } from '@/types'
import type { Book } from '@/types'
import ReaderForm from '@/components/ReaderForm.vue'

const tableRef = ref<TableInstance>()
const loading = ref(false)
const tableData = ref<Reader[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentRow = ref<Reader | null>(null)

const borrowDialogVisible = ref(false)
const borrowLoading = ref(false)
const borrowFormRef = ref<FormInstance>()
const currentReader = ref<Reader | null>(null)
const availableBooks = ref<Book[]>([])
const borrowForm = reactive({
  bookId: null as number | null,
  borrowDays: 30
})

const borrowRules: FormRules = {
  bookId: [
    { required: true, message: '请选择要借阅的图书', trigger: 'change' }
  ],
  borrowDays: [
    { required: true, message: '请输入借阅天数', trigger: 'blur' }
  ]
}

const queryParams = reactive<ReaderQueryParams>({
  pageNum: 1,
  pageSize: 10,
  name: '',
  readerNo: '',
  type: '',
  status: '',
  department: ''
})

async function getList() {
  loading.value = true
  try {
    const res: any = await getReaderList(queryParams)
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
  Object.assign(queryParams, {
    name: '', readerNo: '', type: '', status: '', department: '',
    pageNum: 1, pageSize: 10
  })
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

function handleSelectionChange(selection: Reader[]) {
  selectedIds.value = selection.map((item) => item.id)
}

function handleAdd() {
  isEdit.value = false
  currentRow.value = null
  dialogVisible.value = true
}

function handleEdit(row: Reader) {
  isEdit.value = true
  currentRow.value = { ...row }
  dialogVisible.value = true
}

function handleDetail(row: Reader) {
  window.open(`/reader/detail/${row.id}`, '_blank')
}

// 借阅弹窗里只列还有库存的书
async function handleBorrow(row: Reader) {
  currentReader.value = row
  borrowForm.bookId = null
  borrowForm.borrowDays = 30
  try {
    const res: any = await getBookList({ pageNum: 1, pageSize: 100 })
    if (res.code === 200) {
      availableBooks.value = res.data.list.filter((b: Book) => b.availableCopies > 0)
    }
  } catch {
    availableBooks.value = []
  }
  borrowDialogVisible.value = true
}

// 借书成功得刷新列表，读者身上的借阅数和图书库存都变了
async function submitBorrow() {
  if (!borrowFormRef.value || !currentReader.value || !borrowForm.bookId) return
  try {
    await borrowFormRef.value.validate()
    borrowLoading.value = true
    const res: any = await addBorrowRecord({
      bookId: borrowForm.bookId,
      readerId: currentReader.value.id,
      borrowDays: borrowForm.borrowDays
    })
    if (res.code === 200) {
      ElMessage.success('借阅成功')
      borrowDialogVisible.value = false
      getList()
    }
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message)
    }
  } finally {
    borrowLoading.value = false
  }
}

// 删除前确认，用户取消会进 catch
async function handleDelete(row: Reader) {
  try {
    await ElMessageBox.confirm(
      `确定要删除读者「${row.name}」吗？删除后不可恢复！`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    const res: any = await deleteReader(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getList()
    }
  } catch { /* 用户取消 */ }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的记录')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条读者记录吗？删除后不可恢复！`,
      '批量删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    const res: any = await batchDeleteReaders(selectedIds.value)
    if (res.code === 200) {
      ElMessage.success(res.message || '批量删除成功')
      tableRef.value?.clearSelection()
      getList()
    }
  } catch { /* 用户取消 */ }
}

function handleExport() {
  if (tableData.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  exportToExcel(tableData.value, {
    filename: `读者列表_${new Date().toISOString().slice(0, 10)}`,
    sheetName: '读者列表',
    columns: [
      { key: 'readerNo', label: '读者证号' },
      { key: 'name', label: '姓名' },
      { key: 'gender', label: '性别' },
      { key: 'type', label: '类型' },
      { key: 'department', label: '院系' },
      { key: 'phone', label: '联系电话' },
      { key: 'email', label: '邮箱' },
      { key: 'status', label: '状态' },
      { key: 'maxBorrowCount', label: '最大借阅数' },
      { key: 'currentBorrowCount', label: '当前借阅数' },
      { key: 'registerDate', label: '注册日期' },
      { key: 'expireDate', label: '有效期至' }
    ]
  })
  ElMessage.success('导出成功')
}

onMounted(() => { getList() })
</script>

<style scoped>
.reader-list-container { padding: 0; }
.search-card { margin-bottom: 16px; border: none; }
.table-card { border: none; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.toolbar-left { display: flex; gap: 10px; }
.table-actions { display: flex; justify-content: center; gap: 4px; }
.table-actions .el-button { padding: 0 4px; }
.pagination-area { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>
