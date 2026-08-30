import { useEffect } from 'react'
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { OrganizationProvider } from './context/OrganizationContext'
import { RequireAuth } from './components/RequireAuth'
import OfflineStatus from './components/OfflineStatus'
import { startOfflineSync } from './services/offlineSync'
import Login from './pages/Login'
import Register from './pages/Register'
import AcceptInvitation from './pages/AcceptInvitation'
import Dashboard from './pages/Dashboard'
import OrganizationSettings from './pages/OrganizationSettings'
import AccountSecurity from './pages/AccountSecurity'
import Settings from './pages/Settings'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Members from './pages/Members'
import Projects from './pages/Projects'
import ProjectActivities from './pages/ProjectActivities'
import Expenses from './pages/Expenses'
import Revenues from './pages/Revenues'
import Donors from './pages/Donors'
import ChartOfAccounts from './pages/ChartOfAccounts'
import Bank from './pages/Bank'
import Cash from './pages/Cash'
import Budgets from './pages/Budgets'
import Documents from './pages/Documents'
import Reports from './pages/Reports'
import FinancialStatements from './pages/FinancialStatements'
import AuditLogs from './pages/AuditLogs'
import Funds from './pages/Funds'
import Balance from './pages/Balance'
import Ledger from './pages/Ledger'
import AccountingChartOfAccounts from './pages/AccountingChartOfAccounts'
import JournalEntries from './pages/JournalEntries'
import Conflicts from './pages/Conflicts'
import Billing from './pages/Billing'
import AccessBlockedOverlay from './components/AccessBlockedOverlay'
import { SuperAdminAuthProvider } from './context/SuperAdminAuthContext'
import { RequireSuperAdmin } from './pages/SuperAdmin/RequireSuperAdmin'
import SuperAdminLogin from './pages/SuperAdmin/SuperAdminLogin'
import SuperAdminRegister from './pages/SuperAdmin/SuperAdminRegister'
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard'
import SuperAdminProfile from './pages/SuperAdmin/SuperAdminProfile'
import SuperAdminOrganizationDetail from './pages/SuperAdmin/SuperAdminOrganizationDetail'
import SuperAdminSubscriptionPlans from './pages/SuperAdmin/SuperAdminSubscriptionPlans'

function ProtectedArea({ children }: { children: React.ReactNode }) {
  return <RequireAuth><OrganizationProvider>{children}</OrganizationProvider></RequireAuth>
}

function AppRoutes() {
  return <Routes>
    <Route path="/super-admin/login" element={<SuperAdminAuthProvider><SuperAdminLogin /></SuperAdminAuthProvider>} />
    <Route path="/super-admin/register" element={<SuperAdminAuthProvider><SuperAdminRegister /></SuperAdminAuthProvider>} />
    <Route path="/super-admin" element={<SuperAdminAuthProvider><RequireSuperAdmin><SuperAdminDashboard /></RequireSuperAdmin></SuperAdminAuthProvider>} />
    <Route path="/super-admin/profile" element={<SuperAdminAuthProvider><RequireSuperAdmin><SuperAdminProfile /></RequireSuperAdmin></SuperAdminAuthProvider>} />
    <Route path="/super-admin/organizations/:id" element={<SuperAdminAuthProvider><RequireSuperAdmin><SuperAdminOrganizationDetail /></RequireSuperAdmin></SuperAdminAuthProvider>} />
    <Route path="/super-admin/subscription-plans" element={<SuperAdminAuthProvider><RequireSuperAdmin><SuperAdminSubscriptionPlans /></RequireSuperAdmin></SuperAdminAuthProvider>} />

    <Route path="*" element={<AuthProvider><OfflineStatus /><AccessBlockedOverlay /><Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invitation/:token" element={<AcceptInvitation />} />
      <Route path="/" element={<ProtectedArea><Dashboard /></ProtectedArea>} />
      <Route path="/organization" element={<ProtectedArea><OrganizationSettings /></ProtectedArea>} />
      <Route path="/account/security" element={<ProtectedArea><AccountSecurity /></ProtectedArea>} />
      <Route path="/settings" element={<ProtectedArea><Settings /></ProtectedArea>} />
      <Route path="/billing" element={<ProtectedArea><Billing /></ProtectedArea>} />
      <Route path="/members" element={<ProtectedArea><Members /></ProtectedArea>} />
      <Route path="/projects" element={<ProtectedArea><Projects /></ProtectedArea>} />
      <Route path="/projects/:projectId/activities" element={<ProtectedArea><ProjectActivities /></ProtectedArea>} />
      <Route path="/expenses" element={<ProtectedArea><Expenses /></ProtectedArea>} />
      <Route path="/revenues" element={<ProtectedArea><Revenues /></ProtectedArea>} />
      <Route path="/donors" element={<ProtectedArea><Donors /></ProtectedArea>} />
      <Route path="/chart-of-accounts" element={<ProtectedArea><ChartOfAccounts /></ProtectedArea>} />
      <Route path="/cash" element={<ProtectedArea><Cash /></ProtectedArea>} />
      <Route path="/bank" element={<ProtectedArea><Bank /></ProtectedArea>} />
      <Route path="/budgets" element={<ProtectedArea><Budgets /></ProtectedArea>} />
      <Route path="/documents" element={<ProtectedArea><Documents /></ProtectedArea>} />
      <Route path="/reports" element={<ProtectedArea><Reports /></ProtectedArea>} />
      <Route path="/financial-statements" element={<ProtectedArea><FinancialStatements /></ProtectedArea>} />
      <Route path="/accounting/funds" element={<ProtectedArea><Funds /></ProtectedArea>} />
      <Route path="/accounting/balance" element={<ProtectedArea><Balance /></ProtectedArea>} />
      <Route path="/accounting/ledger" element={<ProtectedArea><Ledger /></ProtectedArea>} />
      <Route path="/accounting/chart-of-accounts" element={<ProtectedArea><AccountingChartOfAccounts /></ProtectedArea>} />
      <Route path="/accounting/journal-entries" element={<ProtectedArea><JournalEntries /></ProtectedArea>} />
      <Route path="/audit" element={<ProtectedArea><AuditLogs /></ProtectedArea>} />
      <Route path="/conflicts" element={<ProtectedArea><Conflicts /></ProtectedArea>} />
    </Routes></AuthProvider>} />
  </Routes>
}

export default function App() {
  useEffect(() => startOfflineSync(), [])

  const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter

  return <Router><AppRoutes /></Router>
}
