<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑图书' : '新增图书'"
    width="700px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="book-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="ISBN" prop="isbn">
            <el-input v-model="formData.isbn" placeholder="请输入ISBN" maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="书名" prop="title">
            <el-input v-model="formData.title" placeholder="请输入书名" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="作者" prop="author">
            <el-input v-model="formData.author" placeholder="请输入作者" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出版社" prop="publisher">
            <el-input v-model="formData.publisher" placeholder="请输入出版社" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出版日期" prop="publishDate">
            <el-date-picker
              v-model="formData.publishDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分类" prop="category">
            <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="价格(元)" prop="price">
            <el-input-number
              v-model="formData.price"
              :min="0"
              :precision="2"
              :step="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="总库存" prop="totalCopies">
            <el-input-number
              v-model="formData.totalCopies"
              :min="0"
              :step="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
              <el-option label="可借阅" value="可借阅" />
              <el-option label="已借出" value="已借出" />
              <el-option label="已预约" value="已预约" />
              <el-option label="已丢失" value="已丢失" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="馆藏位置" prop="location">
            <el-input v-model="formData.location" placeholder="如：A区-01-01" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="封面图片">
            <el-upload
              class="cover-uploader"
              :show-file-list="false"
              :before-upload="beforeCoverUpload"
              :http-request="handleCoverUpload"
              accept="image/*"
            >
              <el-image v-if="formData.coverUrl" :src="formData.coverUrl" fit="cover" class="cover-preview" />
              <div v-else class="cover-placeholder">
                <el-icon :size="28"><Plus /></el-icon>
                <span>上传封面</span>
              </div>
            </el-upload>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="简介" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入图书简介"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// 图书表单，新增和编辑共用一个，靠 isEdit 区分
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { addBook, updateBook } from '@/apis/request'
import type { BookFormData } from '@/types'

const props = defineProps<{
  visible: boolean
  formData: BookFormData | null
  isEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

// 弹窗开关实际存在父组件，这里做一层透传
const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const categoryOptions = ['文学', '科学', '技术', '历史', '教育', '艺术', '经济', '其他']

const formData = reactive<BookFormData>({
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  publishDate: '',
  category: '',
  price: 0,
  totalCopies: 1,
  status: '可借阅',
  description: '',
  coverUrl: '',
  location: ''
})

const formRules: FormRules = {
  isbn: [
    { required: true, message: '请输入ISBN', trigger: 'blur' },
    { pattern: /^[0-9-]{10,20}$/, message: 'ISBN格式不正确', trigger: 'blur' }
  ],
  title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  publisher: [{ required: true, message: '请输入出版社', trigger: 'blur' }],
  publishDate: [{ required: true, message: '请选择出版日期', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  totalCopies: [{ required: true, message: '请输入总库存', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  location: [{ required: true, message: '请输入馆藏位置', trigger: 'blur' }]
}

// 打开弹窗时重新填一遍表单，不然残留的是上一次的数据
watch(() => props.visible, (val) => {
  if (val) {
    if (props.isEdit && props.formData) {
      Object.assign(formData, props.formData)
    } else {
      resetForm()
    }
  }
})

function resetForm() {
  Object.assign(formData, {
    isbn: '', title: '', author: '', publisher: '', publishDate: '',
    category: '', price: 0, totalCopies: 1, status: '可借阅',
    description: '', coverUrl: '', location: ''
  })
  formRef.value?.clearValidate()
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

// 没后端，直接把图片读成 base64 存进表单
function handleCoverUpload(options: any) {
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.coverUrl = e.target?.result as string
    ElMessage.success('封面上传成功')
  }
  reader.readAsDataURL(options.file)
}

// 编辑走 updateBook，新增走 addBook
async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (props.isEdit) {
      const res: any = await updateBook(formData)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        emit('success')
        visible.value = false
      }
    } else {
      const res: any = await addBook(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        emit('success')
        visible.value = false
      }
    }
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message)
    }
  } finally {
    submitLoading.value = false
  }
}

function handleClosed() {
  resetForm()
}
</script>

<style scoped>
.book-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.cover-uploader {
  display: block;
}

.cover-preview {
  width: 100px;
  height: 140px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.cover-placeholder {
  width: 100px;
  height: 140px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #8c939d;
  cursor: pointer;
  transition: border-color 0.3s;
}

.cover-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}
</style>
