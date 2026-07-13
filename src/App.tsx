import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ImageGen from './pages/ImageGen'
import VideoGen from './pages/VideoGen'
import StyleLibrary from './pages/StyleLibrary'
import Settings from './pages/Settings'
import Works from './pages/Works'
import Canvas from './pages/Canvas'
import Tools from './pages/Tools'
import Account from './pages/Account'

// 路由表严格遵循 docs/specs/05-信息架构与路由.md
// 使用 React Router v7 官方数据路由 API（createBrowserRouter + RouterProvider）
// Vite base 为 /muser/，React Router 必须同步设置 basename
const BASENAME = '/muser'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'image', element: <ImageGen /> },
        { path: 'video', element: <VideoGen /> },
        { path: 'styles', element: <StyleLibrary /> },
        { path: 'settings', element: <Settings /> },
        { path: 'works', element: <Works /> },
        { path: 'canvas', element: <Canvas /> },
        { path: 'tools', element: <Tools /> },
        { path: 'account', element: <Account /> },
      ],
    },
  ],
  { basename: BASENAME },
)
