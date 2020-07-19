import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../App.vue'

const projectsResponse = {
  projects: [{
    id: '1',
    name: 'Project 1',
  }]
}


const projectResponse = {
  project: {
    id: '1',
    name: 'Project',
    categories: [
      { id: '1', name: 'Category 1' }
    ],
    tasks: []
  }
}

let mockResponse

describe('App', () => {
  beforeAll(() => {
    global['fetch'] = (url: string) => ({
      json: () => ({
        data: mockResponse
      })
    })
  })

  afterAll(() => {
    delete global['fetch']
  })

  it('renders categories', async () => {
    mockResponse = projectsResponse
    const wrapper = mount(App)
    await flushPromises()
    mockResponse = projectResponse
    await wrapper.find('[data-testid="select-project"]').setValue('1')
    await flushPromises()
    console.log(wrapper.html())
    expect(wrapper.html()).toContain('Category 1')
  })
})
