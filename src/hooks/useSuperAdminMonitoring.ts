import { useState, useEffect, useCallback } from 'react';
import SuperAdminMonitoringService, {
  InventorySummary,
  RequestSummary,
  ProcurementSummary,
  ReceivingSummary,
} from '../services/superAdminMonitoringService';
import { isFirebaseConfigured } from '../firebase/firebase';
import { getDemoRequests } from '../firebase/localStore';

export interface MonitoringState {
  inventorySummary: InventorySummary | null;
  requestSummary: RequestSummary | null;
  procurementSummary: ProcurementSummary | null;
  receivingSummary: ReceivingSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function localRequestSummary(): RequestSummary {
  const r = getDemoRequests();
  const COMPLETED_ST = ['ReceivedToInventory','DeliveryFormsRequested','DeliveryFormsSubmitted','DeliveryConfirmedByRequestConfirmer','DeliveryApprovedBySuperAdmin','DeliveryReferredToWarehouse','FS5Created','Delivered','Completed'];
  return {
    total_requests: r.length,
    pending_count: r.filter(x => x.progress < 100 && !COMPLETED_ST.includes(x.status)).length,
    confirmed_count: r.filter(x => x.status === 'ConfirmedByRequestConfirmer').length,
    procurement_count: r.filter(x => ['StockNotAvailable','ProcurementPending','TenderCreated','OffersReceived','ComparisonCreated','WinnerSelected','PurchaseOrderCreated'].includes(x.status)).length,
    ready_count: r.filter(x => x.status === 'StockAvailable').length,
    delivered_count: r.filter(x => x.status === 'Delivered').length,
    completed_count: r.filter(x => x.progress >= 100 || COMPLETED_ST.includes(x.status)).length,
    rejected_count: r.filter(x => x.status?.toLowerCase().includes('rejected')).length,
    urgent_count: r.filter(x => x.currentRequestLevel === 'ډېر عاجل' || x.currentRequestLevel === 'ډېر مهم').length,
    normal_count: r.filter(x => x.currentRequestLevel === 'عادي').length,
    low_count: r.filter(x => x.currentRequestLevel === 'متوسط').length,
  };
}

export function useSuperAdminMonitoring(): MonitoringState {
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [requestSummary, setRequestSummary] = useState<RequestSummary | null>(null);
  const [procurementSummary, setProcurementSummary] = useState<ProcurementSummary | null>(null);
  const [receivingSummary, setReceivingSummary] = useState<ReceivingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inv, req, proc, rec] = await Promise.all([
        SuperAdminMonitoringService.getInventorySummary(),
        SuperAdminMonitoringService.getRequestSummary(),
        SuperAdminMonitoringService.getProcurementSummary(),
        SuperAdminMonitoringService.getReceivingDeliverySummary(),
      ]);
      setInventorySummary(inv);
      setRequestSummary(!isFirebaseConfigured ? localRequestSummary() : req);
      setProcurementSummary(proc);
      setReceivingSummary(rec);
    } catch (e: any) {
      if (!isFirebaseConfigured) {
        setRequestSummary(localRequestSummary());
      } else {
        setError('د معلوماتو بارولو پرمهال ستونزه رامنځته شوه.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { inventorySummary, requestSummary, procurementSummary, receivingSummary, loading, error, refresh: load };
}
