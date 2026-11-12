import { ToastContainer } from "react-toastify"
import AppRoutes from "./routes/AppRoutes"

function App() {
  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={1800}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        draggable={false}
        toastStyle={{ fontSize: "13px", padding: "10px 14px", minHeight: "44px" }}
      />
      <AppRoutes />
    </div>
  )
}

export default App

