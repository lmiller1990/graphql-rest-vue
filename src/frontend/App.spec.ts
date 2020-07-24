import { mount, flushPromises } from '@vue/test-utils'
import App from './App.vue'

const mockProjectsResponse = {
  projects: [
    {
      id: '1',
      name: 'Project'
    }
  ]
}

const mockProjectResponse = {
  project: {
    id: '1',
    name: 'Project',
    categories: [{
      id: '1',
      name: 'My Category',
    }],
    tasks: []
  }
}

let mockResponse

beforeAll(() => {
  global['fetch'] = (url: string) => ({
    json: () => ({
      data: mockResponse
    })
  })
})

test('App', async () => {
  mockResponse = mockProjectsResponse
  const wrapper = mount(App)
  await flushPromises()

  mockResponse = mockProjectResponse
  wrapper.find('select').setValue('1')
  await flushPromises()

  expect(wrapper.html()).toContain('My Category')
})
