import { createRouter, createWebHistory } from 'vue-router'

let appPath = '/app/'
if (window.APPLICATION) {
  appPath = new URL(window.APPLICATION.exposedUrl).pathname
  appPath = appPath.endsWith('/') ? appPath : appPath + '/'
}

const routes = [
  {
    path: appPath,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import(/* webpackChunkName: "home" */ '@/pages/Home.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
