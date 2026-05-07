import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ListingDetail from './pages/ListingDetail'
import CreateListing from './pages/CreateListing'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Transactions from './pages/Transactions'
import Admin from './pages/Admin'
import UserProfile from './pages/UserProfile'
import EditListing from './pages/EditListing'
import Profile from './pages/Profile'
import Payment from './pages/Payment'

function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <Outlet />
      </main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Admin 路由：独立布局，不显示 Navbar */}
          <Route path="/admin" element={
            <AdminRoute><Admin /></AdminRoute>
          } />
          {/* 普通路由：带 Navbar */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/listings/create" element={
              <ProtectedRoute><CreateListing /></ProtectedRoute>
            } />
            <Route path="/listings/:id/edit" element={
              <ProtectedRoute><EditListing /></ProtectedRoute>
            } />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/users/:id" element={<UserProfile />} />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute><Messages /></ProtectedRoute>
            } />
            <Route path="/messages/:listingId" element={
              <ProtectedRoute><Chat /></ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute><Transactions /></ProtectedRoute>
            } />
            <Route path="/payment/:transactionId" element={
              <ProtectedRoute><Payment /></ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
