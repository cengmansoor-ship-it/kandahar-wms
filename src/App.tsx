import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import { ROLES } from "./constants/roles";

import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import Home from "./pages/Dashboard/Home";
import UserManagement from "./pages/UserManagement";
import RoleManagement from "./pages/RoleManagement";

import InventoryDashboard from "./pages/Inventory/Dashboard";
import ItemList from "./pages/Inventory/ItemList";
import AddItem from "./pages/Inventory/AddItem";
import StockIn from "./pages/Inventory/StockIn";
import StockOut from "./pages/Inventory/StockOut";
import InventoryLedger from "./pages/Inventory/Ledger";
import BarcodeScanner from "./pages/Inventory/BarcodeScanner";

import RequestList from "./pages/Requests/RequestList";
import CreateRequest from "./pages/Requests/CreateRequest";
import RequestDetails from "./pages/Requests/RequestDetails";

import ProcurementRequestList from "./pages/Procurement/ProcurementRequestList";
import ProcurementDetails from "./pages/Procurement/ProcurementDetails";
import VendorOffersPage from "./pages/Procurement/VendorOffersPage";

import WarehouseRequestList from "./pages/Receiving/WarehouseRequestList";
import WarehouseRequestDetails from "./pages/Receiving/WarehouseRequestDetails";

import ReportsDashboard from "./pages/Reports/ReportsDashboard";
import InventoryReport from "./pages/Reports/InventoryReport";
import AnnualNeedsReport from "./pages/Reports/AnnualNeedsReport";
import ForecastingReport from "./pages/Reports/ForecastingReport";
import StockMovementReport from "./pages/Reports/StockMovementReport";
import RequestReport from "./pages/Reports/RequestReport";
import ProcurementReport from "./pages/Reports/ProcurementReport";
import ReceivingDeliveryReport from "./pages/Reports/ReceivingDeliveryReport";
import FacultyReport from "./pages/Reports/FacultyReport";
import DepartmentReport from "./pages/Reports/DepartmentReport";
import PersonAssignmentReport from "./pages/Reports/PersonAssignmentReport";
import AuditActivityReport from "./pages/Reports/AuditActivityReport";

import TrashList from "./pages/Maintenance/TrashList";
import RecoveryHistory from "./pages/Maintenance/RecoveryHistory";
import BackupExport from "./pages/Maintenance/BackupExport";
import SystemHealth from "./pages/Maintenance/SystemHealth";
import FinalQAChecklist from "./pages/Maintenance/FinalQAChecklist";
import OfficialFormsPage from "./pages/OfficialForms/OfficialFormsPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import AboutPage from "./pages/About/AboutPage";
import TraceabilityPage from "./pages/Traceability/TraceabilityPage";

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<Navigate to="/signin" replace />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Home />} />

            <Route path="/user-management" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><UserManagement /></ProtectedRoute>} />
            <Route path="/role-management" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><RoleManagement /></ProtectedRoute>} />

            <Route path="/inventory" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_ENTRY_PERSON, ROLES.WAREHOUSE_DIRECTOR]}><InventoryDashboard /></ProtectedRoute>} />
            <Route path="/inventory/items" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_ENTRY_PERSON, ROLES.WAREHOUSE_DIRECTOR]}><ItemList /></ProtectedRoute>} />
            <Route path="/inventory/add" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AddItem /></ProtectedRoute>} />
            <Route path="/inventory/add-item" element={<Navigate to="/inventory/add" replace />} />
            <Route path="/inventory/stock-in" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_ENTRY_PERSON]}><StockIn /></ProtectedRoute>} />
            <Route path="/inventory/stock-out" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><StockOut /></ProtectedRoute>} />
            <Route path="/inventory/ledger" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR]}><InventoryLedger /></ProtectedRoute>} />
            <Route path="/inventory/barcode-scanner" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR]}><BarcodeScanner /></ProtectedRoute>} />

            <Route path="/requests" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.REQUESTER, ROLES.REQUEST_CONFIRMER]}><RequestList /></ProtectedRoute>} />
            <Route path="/requests/create" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.REQUESTER]}><CreateRequest /></ProtectedRoute>} />
            <Route path="/requests/details/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.REQUESTER, ROLES.REQUEST_CONFIRMER]}><RequestDetails /></ProtectedRoute>} />

            <Route path="/procurement" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROCUREMENT_DIRECTOR]}><ProcurementRequestList /></ProtectedRoute>} />
            <Route path="/procurement/details/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROCUREMENT_DIRECTOR]}><ProcurementDetails /></ProtectedRoute>} />
            <Route path="/procurement/offers/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PROCUREMENT_DIRECTOR]}><VendorOffersPage /></ProtectedRoute>} />

            <Route path="/receiving" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR]}><WarehouseRequestList /></ProtectedRoute>} />
            <Route path="/receiving/details/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR]}><WarehouseRequestDetails /></ProtectedRoute>} />

            <Route path="/official-forms" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROCUREMENT_DIRECTOR, ROLES.WAREHOUSE_DIRECTOR, ROLES.REQUESTER, ROLES.REQUEST_CONFIRMER]}><OfficialFormsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROCUREMENT_DIRECTOR, ROLES.WAREHOUSE_DIRECTOR]}><NotificationsPage /></ProtectedRoute>} />

            <Route path="/reports" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROCUREMENT_DIRECTOR, ROLES.WAREHOUSE_DIRECTOR]}><ReportsDashboard /></ProtectedRoute>} />
            <Route path="/reports/inventory" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR]}><InventoryReport /></ProtectedRoute>} />
            <Route path="/reports/movement" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR]}><StockMovementReport /></ProtectedRoute>} />
            <Route path="/reports/requests" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><RequestReport /></ProtectedRoute>} />
            <Route path="/reports/procurement" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.PROCUREMENT_DIRECTOR]}><ProcurementReport /></ProtectedRoute>} />
            <Route path="/reports/delivery" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR]}><ReceivingDeliveryReport /></ProtectedRoute>} />
            <Route path="/reports/faculty" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR]}><FacultyReport /></ProtectedRoute>} />
            <Route path="/reports/department" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR]}><DepartmentReport /></ProtectedRoute>} />
            <Route path="/reports/person-assignment" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR]}><PersonAssignmentReport /></ProtectedRoute>} />
            <Route path="/reports/needs" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><AnnualNeedsReport /></ProtectedRoute>} />
            <Route path="/reports/forecast" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}><ForecastingReport /></ProtectedRoute>} />
            <Route path="/reports/audit" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><AuditActivityReport /></ProtectedRoute>} />

            <Route path="/maintenance/trash" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><TrashList /></ProtectedRoute>} />
            <Route path="/maintenance/recovery-history" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><RecoveryHistory /></ProtectedRoute>} />
            <Route path="/maintenance/backup" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><BackupExport /></ProtectedRoute>} />
            <Route path="/maintenance/health" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><SystemHealth /></ProtectedRoute>} />
            <Route path="/maintenance/final-qa" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><FinalQAChecklist /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><SettingsPage /></ProtectedRoute>} />
            <Route path="/traceability" element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR, ROLES.WAREHOUSE_ENTRY_PERSON]}><TraceabilityPage /></ProtectedRoute>} />
            <Route path="/about" element={<AboutPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
