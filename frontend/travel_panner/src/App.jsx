import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import { GuestRoute, ProtectedRoute } from './auth/RouteGuards'
import Layout from './components/Layout'
import DestinationDetail from './pages/DestinationDetail'
import Destinations from './pages/Destinations'
import Home from './pages/Home'
import Login from './pages/Login'
import NewTrip from './pages/NewTrip'
import Planner from './pages/Planner'
import Profile from './pages/Profile'
import Register from './pages/Register'
import TripDetail from './pages/TripDetail'
import Trips from './pages/Trips'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="destinations" element={<Destinations />} />
            <Route path="destinations/:slug" element={<DestinationDetail />} />
            <Route element={<GuestRoute />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<Profile />} />
              <Route path="planner/:chatId?" element={<Planner />} />
              <Route path="trips" element={<Trips />} />
              <Route path="trips/new" element={<NewTrip />} />
              <Route path="trips/:tripId" element={<TripDetail />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
