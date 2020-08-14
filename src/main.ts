import { createApp } from 'vue'
import App from './frontend/App.vue'
import { store } from './frontend/store'

const app = createApp(App)
app.provide('store', store)

app.mount('#app')
