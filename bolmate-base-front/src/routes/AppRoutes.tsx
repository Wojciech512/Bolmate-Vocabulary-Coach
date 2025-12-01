import { Route, Routes } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import HomePage from '../pages/HomePage'
import UsersPage from '../pages/UsersPage'

const AppRoutes = () => (
  <AppLayout>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/users" element={<UsersPage />} />
    </Routes>
  </AppLayout>
)

export default AppRoutes
