<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑读者' : '新增读者'"
    width="650px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="reader-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="读者证号" prop="readerNo">
            <el-input v-model="formData.readerNo" placeholder="请输入证号" maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="formData.name" placeholder="请输入姓名" maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="formData.gender">
              <el-radio value="男">男</el-radio>
              <el-radio value="女">女</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="读者类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
              <el-option label="学生" value="学生" />
              <el-option label="教师" value="教师" />
              <el-option label="教职工" value="教职工" />
              <el-option label="校外读者" value="校外读者" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属院系" prop="department">
            <el-input v-model="formData.department" placeholder="请输入院系" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电子邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
              <el-option label="正常" value="正常" />
              <el-option label="冻结" value="冻结" />
              <el-option label="注销" value="注销" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最大借阅数" prop="maxBorrowCount">
            <el-input-number
              v-model="formData.maxBorrowCount"
              :min="1"
              :max="50"
              :step="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="有效期至" prop="expireDate">
            <el-date-picker
              v-model="formData.expireDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注信息"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// 读者表单，新增和编辑共用一个
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { addReader, updateReader } from '@/apis/request'
import type { ReaderFormData } from '@/types'

const props = defineProps<{
  visible: boolean
  formData: ReaderFormData | null
  isEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const formData = reactive<ReaderFormData>({
  readerNo: '', name: '', gender: '男', type: '学生',
  department: '', phone: '', email: '', status: '正常',
  maxBorrowCount: 10, expireDate: '', remark: ''
})

const formRules: FormRules = {
  readerNo: [{ required: true, message: '请输入读者证号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  type: [{ required: true, message: '请选择读者类型', trigger: 'change' }],
  department: [{ required: true, message: '请输入所属院系', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  maxBorrowCount: [{ required: true, message: '请输入最大借阅数', trigger: 'blur' }],
  expireDate: [{ required: true, message: '请选择有效期', trigger: 'change' }]
}

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
    readerNo: '', name: '', gender: '男', type: '学生',
    department: '', phone: '', email: '', status: '正常',
    maxBorrowCount: 10, expireDate: '', remark: ''
  })
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitLoading.value = true
    if (props.isEdit) {
      const res: any = await updateReader(formData)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        emit('success')
        visible.value = false
      }
    } else {
      const res: any = await addReader(formData)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        emit('success')
        visible.value = false
      }
    }
  } catch (error: any) {
    if (error?.message) ElMessage.error(error.message)
  } finally {
    submitLoading.value = false
  }
}

function handleClosed() {
  resetForm()
}
</script>

<style scoped>
.reader-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}
</style>
