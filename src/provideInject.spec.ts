import { provide, inject, h } from 'vue'
import { mount } from '@vue/test-utils'

const A = {
  setup () {
    const color = inject('color')
    provide('color', 'blue')
    return () => [
      h('div', { id: 'a' }, `Color is ${color}`),
      h(B)
    ]
  }
}

const B = {
  setup () {
    const color = inject('color')
    return () => h('div', { id: 'b' }, `Color is ${color}`)
  }
}

const App = {
  setup() {
    provide('color', 'red')
    return () => [
      h(A)
    ]
  }
}

test('dep. injection', () => {
  const wrapper = mount(App)
  console.log(wrapper.html())
})