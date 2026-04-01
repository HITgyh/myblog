import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/components/homepage.vue'
import PostDetail from '@/components/postdetail.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/post/:category/:slug',
      name: 'post-detail',
      component: PostDetail,
      props: true
    }
  ]
})

export default router
