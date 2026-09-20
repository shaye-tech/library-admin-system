<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑角色' : '新增角色'"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="formData.roleName" placeholder="请输入角色名称" maxlength="20" />
      </el-form-item>
      <el-form-item label="角色编码" prop="roleCode">
        <el-input
          v-model="formData.roleCode"
          placeholder="请输入角色编码（英文）"
          maxlength="30"
          :disabled="isEdit"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio value="启用">启用</el-radio>
          <el-radio value="禁用">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="2"
          placeholder="请输入角色描述"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="权限配置" prop="permissionIds">
        <div class="permission-tree-container">
          <div class="tree-toolbar">
            <el-button size="small" @click="checkAll">全选</el-button>
            <el-button size="small" @click="uncheckAll">全不选</el-button>
            <span class="checked-count">已选 {{ checkedCount }} 项</span>
          </div>
          <el-tree
            ref="treeRef"
            :data="permissionTreeData"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            show-checkbox
            :default-checked-keys="formData.permissionIds"
            @check="handleCheckChange"
          />
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// 角色表单，比图书和读者的多了棵树用来勾权限
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules, type TreeInstance } from 'element-plus'
import { addRole, updateRole, getPermissionTree } from '@/apis/request'
import type { RoleFormData, PermissionNode } from '@/types'

const props = defineProps<{
  visible: boolean
  formData: RoleFormData | null
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
const treeRef = ref<TreeInstance>()
const submitLoading = ref(false)

const permissionTreeData = ref<PermissionNode[]>([])

const checkedCount = ref(0)

const formData = reactive<RoleFormData>({
  roleName: '',
  roleCode: '',
  description: '',
  status: '启用',
  permissionIds: []
})

const formRules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '编码须以字母开头，仅含字母数字下划线', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  permissionIds: [
    {
      validator: (_rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少选择一项权限'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

async function loadPermissionTree() {
  const res: any = await getPermissionTree()
  if (res.code === 200) {
    permissionTreeData.value = res.data
  }
}

// 勾选变化同步到表单。父节点只勾中一半时不在 checkedKeys 里，要单独把半选的加上
function handleCheckChange() {
  const checkedKeys = treeRef.value?.getCheckedKeys(false) as number[]
  const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() as number[]
  formData.permissionIds = [...checkedKeys, ...halfCheckedKeys]
  checkedCount.value = checkedKeys.length
  formRef.value?.validateField('permissionIds')
}

function checkAll() {
  const allKeys = getAllKeys(permissionTreeData.value)
  treeRef.value?.setCheckedKeys(allKeys)
  handleCheckChange()
}

function uncheckAll() {
  treeRef.value?.setCheckedKeys([])
  formData.permissionIds = []
  checkedCount.value = 0
}

function getAllKeys(nodes: PermissionNode[]): number[] {
  let keys: number[] = []
  nodes.forEach((node) => {
    keys.push(node.id)
    if (node.children) {
      keys = keys.concat(getAllKeys(node.children))
    }
  })
  return keys
}

watch(() => props.visible, (val) => {
  if (val) {
    if (props.isEdit && props.formData) {
      Object.assign(formData, props.formData)
      checkedCount.value = props.formData.permissionIds?.length || 0
      // 树这会儿还没渲染完，setCheckedKeys 得等一帧再调
      setTimeout(() => {
        treeRef.value?.setCheckedKeys(props.formData!.permissionIds || [])
      }, 100)
    } else {
      resetForm()
    }
  }
})

function resetForm() {
  Object.assign(formData, {
    roleName: '', roleCode: '', description: '', status: '启用', permissionIds: []
  })
  checkedCount.value = 0
  formRef.value?.clearValidate()
  setTimeout(() => treeRef.value?.setCheckedKeys([]), 100)
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    // 表单规则里其实已经拦了一道，提交前再确认一次
    if (formData.permissionIds.length === 0) {
      ElMessage.warning('请至少选择一项权限')
      return
    }
    submitLoading.value = true
    if (props.isEdit) {
      const res: any = await updateRole(formData)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        emit('success')
        visible.value = false
      }
    } else {
      const res: any = await addRole(formData)
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

onMounted(() => {
  loadPermissionTree()
})
</script>

<style scoped>
.permission-tree-container {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.checked-count {
  margin-left: auto;
  font-size: 13px;
  color: #909399;
}
</style>
