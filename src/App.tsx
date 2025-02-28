import { PropsWithChildren } from 'react'

function App({ children }: PropsWithChildren) {
  return (
    <div className="min-h-full h-full bg-gray-50">
      {children}
    </div>
  )
}

export default App
