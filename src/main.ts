import { createApp } from 'vue'
import App from './frontend/App.vue'
import { provideStore } from './frontend/store'

const app = createApp(App)

// const StorePlugin = {
//   install(app) {
//     provideStore(app)
//   }
// }

// app.use(StorePlugin)
app.mount('#app')
