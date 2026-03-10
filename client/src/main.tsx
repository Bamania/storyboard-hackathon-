import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgBase: '#0a0a0a',
          colorBgContainer: '#121212',
          colorPrimary: '#00e5ff',
          colorTextBase: '#edf2f8',
          borderRadius: 12,
          fontFamily: 'Sora, sans-serif',
        },
      }}
    >
      <App />
    </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
