import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ListingDetail from './pages/ListingDetail'
import CreateListing from './pages/CreateListing'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Transactions from './pages/Transactions'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Navbar />
        <main className="min-h-screen bg-slate-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/listings/create" element={
              <ProtectedRoute><CreateListing /></ProtectedRoute>
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
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
