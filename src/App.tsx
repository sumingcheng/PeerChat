import { hotkeys } from '@/services/hotkeys'
import { useEffect } from 'react'
import { PropsWithChildren } from 'react'

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    // 使用 try-catch 包装快捷键初始化
    const initHotkeys = async () => {
      try {
        await hotkeys.init()
        hotkeys.enable()
      } catch (error) {
        console.error('快捷键初始化失败:', error)
      }
    }

    initHotkeys()

    return () => {
      hotkeys.disable()
    }
  }, [])

  return (
    <div className="min-h-full h-full bg-gray-50">
      {children}
    </div>
  )
}

export default App
