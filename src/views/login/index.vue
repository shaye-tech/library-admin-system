<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <div class="login-card">
      <div class="login-header">
        <el-icon :size="48" color="#409eff"><Reading /></el-icon>
        <h1 class="login-title">校园图书管理系统</h1>
        <p class="login-subtitle">Library Management System</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <div class="login-options">
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="userStore.loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-tips">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            测试账号：admin / 123456（管理员），librarian / 123456（图书管理员）
          </template>
        </el-alert>
      </div>
    </div>

    <div class="login-footer">
      <p>© 2026 校园图书管理系统 | Web前端设计与开发实训</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 登录页。"记住我"是把账号密码塞进 localStorage，没做加密
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Reading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const REMEMBER_KEY = 'library_remember_info'

const loginFormRef = ref<FormInstance>()

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

// 打开页面时把上次记住的账号密码填回去
onMounted(() => {
  const savedInfo = localStorage.getItem(REMEMBER_KEY)
  if (savedInfo) {
    try {
      const { username, password } = JSON.parse(savedInfo)
      loginForm.username = username || ''
      loginForm.password = password || ''
      loginForm.remember = true
    } catch {
      // 存的东西格式不对就当没存过
    }
  }
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
    const success = await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    if (success) {
      ElMessage.success('登录成功')
      // 勾了就存，没勾就把之前存的清掉
      if (loginForm.remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        }))
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }
      // 之前被守卫打发过来的时候带了 redirect，登完回原来那页
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    }
  } catch (error: any) {
    // 失败用 alert 弹窗，顶部提示容易一闪而过看不清
    const errorMsg = error?.message || '登录失败，请检查用户名和密码'
    ElMessageBox.alert(errorMsg, '登录失败', {
      confirmButtonText: '确定',
      type: 'error'
    })
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.bg-circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
}

.bg-circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: -50px;
  animation-delay: 2s;
}

.bg-circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: 10%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.login-card {
  position: relative;
  z-index: 10;
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-title {
  margin: 16px 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.login-subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
  letter-spacing: 1px;
}

.login-form {
  margin-top: 20px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.login-btn {
  width: 100%;
  font-size: 16px;
  letter-spacing: 4px;
}

.login-tips {
  margin-top: 10px;
}

.login-footer {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}
</style>
