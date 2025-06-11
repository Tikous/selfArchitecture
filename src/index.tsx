import { createRoot } from 'react-dom/client'

const App = () => {
  return (
    <>
      <h1>hello world</h1>
    </>
  )
}
const container = document.getElementById("app")
if (!container) {
  throw new Error("Failed to find the root element")
}
const root = createRoot(container)

root.render(<App />)