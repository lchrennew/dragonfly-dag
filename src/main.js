import { createApp } from 'vue'
import App from './App.vue'
import './index.less'
import Antdv from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'

const app = createApp(App)
app.config.unwrapInjectedRef = true
app.use(Antdv).mount('#app')
