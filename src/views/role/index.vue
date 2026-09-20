<template>
  <div class="role-list-container">
    <el-card class="table-card" shadow="never">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" v-auth-btn="'role:edit'" @click="handleAdd">
            新增角色
          </el-button>
          <el-button type="warning" :icon="Lock" @click="openUserManage">
            用户密码管理
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Refresh" circle @click="getList" />
        </div>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column :resizable="false" type="index" label="序号" width="55" align="center" />
        <el-table-column :resizable="false" prop="roleName" label="角色名称" width="120" />
        <el-table-column :resizable="false" prop="roleCode" label="角色编码" width="120" />
        <el-table-column :resizable="false" prop="description" label="描述" min-width="160" show-overflow-tooltip />
        <el-table-column :resizable="false" prop="status" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :resizable="false" label="权限数" width="70" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.permissionIds?.length || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :resizable="false" prop="createTime" label="创建时间" width="160" align="center" />
        <el-table-column :resizable="false" label="操作" width="200" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" link size="small" @click="handleViewPermission(row)">查看权限</el-button>
              <el-button type="primary" link size="small" v-auth-btn="'role:edit'" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" v-auth-btn="'role:edit'" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <role-form
      v-model:visible="dialogVisible"
      :form-data="currentRow"
      :is-edit="isEdit"
      @success="getList"
    />

    <el-dialog v-model="permissionDialogVisible" title="角色权限详情" width="500px">
      <div class="permission-view">
        <p><strong>角色名称：</strong>{{ currentRole?.roleName }}</p>
        <p><strong>角色编码：</strong>{{ currentRole?.roleCode }}</p>
        <p><strong>权限列表：</strong></p>
        <el-tree
          :data="permissionTreeData"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          :default-checked-keys="currentRole?.permissionIds || []"
          show-checkbox
          disabled
        />
      </div>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="userManageVisible" title="用户密码管理" width="700px" :close-on-click-modal="false">
      <el-table :data="userList" border stripe v-loading="userManageLoading">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" size="small">{{ getRoleName(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="password" label="密码" width="120" align="center">
          <template #default="{ row }">
            <span class="password-text">{{ showPwdIds.includes(row.id) ? row.password : '******' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" link size="small" @click="togglePwd(row)">
                {{ showPwdIds.includes(row.id) ? '隐藏' : '查看' }}
              </el-button>
              <el-button type="warning" link size="small" @click="openChangePwd(row)">修改密码</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="userManageVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="changePwdVisible" title="修改用户密码" width="420px" :close-on-click-modal="false">
      <el-form ref="changePwdFormRef" :model="changePwdForm" :rules="changePwdRules" label-width="90px">
        <el-form-item label="用户名">
          <el-input :value="currentPwdUser?.username" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="changePwdForm.newPassword" type="password" show-password placeholder="请输入新密码（6-20位）" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="changePwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changePwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="changePwdLoading" @click="submitChangePwd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 角色管理。用户密码管理也放在这一页，没单独开菜单
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Lock } from '@element-plus/icons-vue'
import { getRoleList, deleteRole, getPermissionTree, getUserListForManage, changeUserPassword, get, post } from '@/apis/request'
import type { Role, RoleQueryParams, PermissionNode, UserInfo } from '@/types'
import RoleForm from '@/components/RoleForm.vue'

const loading = ref(false)
const tableData = ref<Role[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentRow = ref<Role | null>(null)

const permissionDialogVisible = ref(false)
const currentRole = ref<Role | null>(null)
const permissionTreeData = ref<PermissionNode[]>([])

const userManageVisible = ref(false)
const userManageLoading = ref(false)
const userList = ref<UserInfo[]>([])
const showPwdIds = ref<number[]>([])

const changePwdVisible = ref(false)
const changePwdLoading = ref(false)
const changePwdFormRef = ref<FormInstance>()
const currentPwdUser = ref<UserInfo | null>(null)
const changePwdForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

const changePwdRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== changePwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const queryParams = reactive<RoleQueryParams>({
  pageNum: 1,
  pageSize: 10
})

async function getList() {
  loading.value = true
  try {
    const res: any = await getRoleList(queryParams)
    if (res.code === 200) {
      tableData.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

async function loadPermissionTree() {
  const res: any = await getPermissionTree()
  if (res.code === 200) {
    permissionTreeData.value = res.data
  }
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size
  getList()
}

function handleCurrentChange(page: number) {
  queryParams.pageNum = page
  getList()
}

function handleAdd() {
  isEdit.value = false
  currentRow.value = null
  dialogVisible.value = true
}

function handleEdit(row: Role) {
  isEdit.value = true
  currentRow.value = { ...row }
  dialogVisible.value = true
}

function handleViewPermission(row: Role) {
  currentRole.value = row
  permissionDialogVisible.value = true
}

function getRoleName(role: string): string {
  const map: Record<string, string> = {
    admin: '超级管理员',
    librarian: '图书管理员',
    user: '普通用户'
  }
  return map[role] || role
}

function getRoleTagType(role: string): string {
  const map: Record<string, string> = {
    admin: 'danger',
    librarian: 'warning',
    user: 'info'
  }
  return map[role] || ''
}

async function openUserManage() {
  userManageVisible.value = true
  showPwdIds.value = []
  await loadUserList()
}

// 用户列表里带着密码字段，表格里默认打码，点"查看"才显示
async function loadUserList() {
  userManageLoading.value = true
  try {
    const res: any = await get('/user/manage-list')
    if (res.code === 200) {
      userList.value = res.data
    }
  } finally {
    userManageLoading.value = false
  }
}

function togglePwd(row: UserInfo) {
  const index = showPwdIds.value.indexOf(row.id)
  if (index > -1) {
    showPwdIds.value.splice(index, 1)
  } else {
    showPwdIds.value.push(row.id)
  }
}

function openChangePwd(row: UserInfo) {
  currentPwdUser.value = row
  changePwdForm.newPassword = ''
  changePwdForm.confirmPassword = ''
  changePwdVisible.value = true
}

async function submitChangePwd() {
  if (!changePwdFormRef.value || !currentPwdUser.value) return
  try {
    await changePwdFormRef.value.validate()
    changePwdLoading.value = true
    const res: any = await post('/user/change-password', {
      userId: currentPwdUser.value.id,
      newPassword: changePwdForm.newPassword
    })
    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      changePwdVisible.value = false
      loadUserList()
    }
  } catch {
    // 校验没过，错误提示由 el-form 自己显示
  } finally {
    changePwdLoading.value = false
  }
}

// 超管角色不给删，其他的删之前先确认一下
async function handleDelete(row: Role) {
  if (row.roleCode === 'admin') {
    ElMessage.warning('超级管理员角色不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除角色「${row.roleName}」吗？删除后关联用户将失去对应权限！`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    const res: any = await deleteRole(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getList()
    }
  } catch { /* 用户取消 */ }
}

onMounted(() => {
  getList()
  loadPermissionTree()
})
</script>

<style scoped>
.role-list-container { padding: 0; }
.table-card { border: none; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.toolbar-left { display: flex; gap: 10px; }
.table-actions { display: flex; justify-content: center; gap: 4px; flex-wrap: wrap; }
.table-actions .el-button { padding: 0 4px; }
.pagination-area { display: flex; justify-content: flex-end; margin-top: 20px; }
.permission-view p { margin: 0 0 12px; }
.password-text { font-family: monospace; color: #606266; }
</style>
