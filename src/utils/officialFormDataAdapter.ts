import type { InventoryRequest } from "../firebase/requests";
import type { VendorOffer, ReceiptReportRecord } from "../firebase/procurement";
import type { FS5Document } from "../firebase/receiving";
import type { OfficialFormSharedData, OfficialTemplateId } from "../components/OfficialFormViewer";

export type { OfficialFormSharedData };

const FORM_ORDER = ["proposal", "tender", "comparison", "purchaseOrder", "receiptReport", "si9", "pc5"];

const TEMPLATE_TO_FORM: Record<string, string> = {
  formTemplate0: "proposal",
  formTemplate1: "tender",
  formTemplate2: "comparison",
  formTemplate3: "purchaseOrder",
  formTemplate4: "receiptReport",
  formTemplate5: "si9",
  formTemplate6: "pc5",
};

export function getOfficialFormKey(requestId: string, formType: string): string {
  return `ku_req_${requestId}_procurement_form_${formType}`;
}

export function getOfficialTemplateId(formType: string): OfficialTemplateId {
  const map: Record<string, OfficialTemplateId> = {
    proposal: "formTemplate0",
    tender: "formTemplate1",
    comparison: "formTemplate2",
    purchaseOrder: "formTemplate3",
    receiptReport: "formTemplate4",
    si9: "formTemplate5",
    fs5: "formTemplate6",
    pc5: "formTemplate6",
  };
  return map[formType] || "formTemplate0";
}

export function loadOfficialFormData(requestId: string, formType: string): OfficialFormSharedData | null {
  try {
    const key = getOfficialFormKey(requestId, formType);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as OfficialFormSharedData;
  } catch {
    return null;
  }
}

export function saveOfficialFormData(requestId: string, formType: string, data: OfficialFormSharedData): void {
  try {
    const key = getOfficialFormKey(requestId, formType);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage may be full or unavailable
  }
}

export function extractSharedRequestData(request: InventoryRequest): Record<string, string> {
  return {
    v7RequesterName: request.requesterName || "",
    v7ProposalSubject: request.reason || request.items?.[0]?.name || "",
    v7FacultySelect: request.faculty || "",
    v7FacultyDepartment: request.departmentOrPerson || "",
  };
}

export function extractSharedItemRows(items: InventoryRequest["items"]): OfficialFormSharedData["itemRows"] {
  return (items || []).map((item, idx) => ({
    serial: String(idx + 1),
    itemName: item.name || "",
    itemType: item.specifications || item.name || "",
    itemNameType: item.specifications ? `${item.name} - ${item.specifications}` : item.name || "",
    quantity: String(item.quantity || ""),
    unit: item.unit || "",
    unitPrice: "",
    totalPrice: "",
  }));
}

export function extractVendorOfferRows(
  offers: VendorOffer[],
  requestItems: InventoryRequest["items"]
): OfficialFormSharedData["itemRows"] {
  if (!offers || offers.length === 0) return extractSharedItemRows(requestItems);

  const winner = selectWinningVendor(offers);
  if (!winner) return extractSharedItemRows(requestItems);

  return (winner.items || []).map((item, idx) => ({
    serial: String(idx + 1),
    itemName: item.itemName || "",
    itemType: item.itemName || "",
    itemNameType: item.itemName || "",
    quantity: String(item.quantity || ""),
    unit: item.unit || "",
    unitPrice: String(item.unitPrice || ""),
    totalPrice: String(item.totalPrice || item.quantity * item.unitPrice || ""),
  }));
}

export function calculateOfferTotals(offers: VendorOffer[]): number[] {
  return (offers || []).map((offer) => {
    if (offer.totalOfferPrice) return offer.totalOfferPrice;
    return (offer.items || []).reduce((sum, item) => sum + (item.totalPrice || item.quantity * item.unitPrice || 0), 0);
  });
}

export function selectWinningVendor(offers: VendorOffer[]): VendorOffer | null {
  if (!offers || offers.length === 0) return null;
  const totals = calculateOfferTotals(offers);
  let winnerIdx = 0;
  let minTotal = totals[0];
  totals.forEach((t, i) => {
    if (t < minTotal) { minTotal = t; winnerIdx = i; }
  });
  return offers[winnerIdx];
}

export function mapRequestToProposal(request: InventoryRequest): OfficialFormSharedData {
  const items = extractSharedItemRows(request.items);
  const grandTotal = items.reduce((s, item) => {
    const n = parseFloat(item.totalPrice || "0");
    return s + (isFinite(n) ? n : 0);
  }, 0);
  return {
    sourceTemplateId: "formTemplate0",
    sourceFormName: "proposal",
    sharedFields: {
      ...extractSharedRequestData(request),
      v7RequesterName: request.requesterName || "",
      v7ProposalSubject: request.reason || request.items?.[0]?.name || "",
    },
    itemRows: items,
    grandTotal,
    savedAt: new Date().toISOString(),
  };
}

export function mapRequestToSI9(request: InventoryRequest): OfficialFormSharedData {
  const items = extractSharedItemRows(request.items);
  return {
    sourceTemplateId: "formTemplate5",
    sourceFormName: "si9",
    sharedFields: extractSharedRequestData(request),
    itemRows: items,
    grandTotal: 0,
    savedAt: new Date().toISOString(),
  };
}

export function mapVendorOffersToComparison(
  offers: VendorOffer[],
  requestItems: InventoryRequest["items"]
): OfficialFormSharedData {
  const totals = calculateOfferTotals(offers);
  const winner = selectWinningVendor(offers);

  const itemRows: OfficialFormSharedData["itemRows"] = (requestItems || []).map((item, idx) => {
    const prices = offers.map((offer) => {
      const offerItem = (offer.items || []).find((oi) => oi.itemName === item.name) ||
        (offer.items || [])[idx];
      return offerItem ? offerItem.unitPrice : 0;
    });
    const minPrice = Math.min(...prices.filter((p) => p > 0));
    const winnerOffer = offers.find((o, i) => totals[i] === Math.min(...totals));
    const winnerItem = winnerOffer
      ? (winnerOffer.items || []).find((oi) => oi.itemName === item.name) ||
        (winnerOffer.items || [])[idx]
      : null;

    return {
      serial: String(idx + 1),
      itemName: item.name || "",
      itemType: item.specifications || "",
      itemNameType: item.name || "",
      quantity: String(item.quantity || ""),
      unit: item.unit || "",
      unitPrice: String(winnerItem?.unitPrice || minPrice || ""),
      totalPrice: String(winnerItem?.totalPrice || (item.quantity * (winnerItem?.unitPrice || 0)) || ""),
    };
  });

  const grandTotal = winner
    ? calculateOfferTotals([winner])[0]
    : totals.reduce((a, b) => a + b, 0) / (totals.length || 1);

  return {
    sourceTemplateId: "formTemplate2",
    sourceFormName: "comparison",
    sharedFields: {
      v7ProposalSubject: winner ? `ګټونکی: ${winner.vendorName}` : "",
    },
    itemRows,
    grandTotal,
    savedAt: new Date().toISOString(),
  };
}

export function mapWinnerToPurchaseOrder(
  winner: VendorOffer,
  request: InventoryRequest
): OfficialFormSharedData {
  const itemRows: OfficialFormSharedData["itemRows"] = (winner.items || []).map((item, idx) => ({
    serial: String(idx + 1),
    itemName: item.itemName || "",
    itemType: item.itemName || "",
    itemNameType: item.itemName || "",
    quantity: String(item.quantity || ""),
    unit: item.unit || "",
    unitPrice: String(item.unitPrice || ""),
    totalPrice: String(item.totalPrice || item.quantity * item.unitPrice || ""),
  }));

  const grandTotal = calculateOfferTotals([winner])[0];

  return {
    sourceTemplateId: "formTemplate3",
    sourceFormName: "purchaseOrder",
    sharedFields: {
      ...extractSharedRequestData(request),
      v7ProposalSubject: `${winner.vendorName} - ${request.reason || ""}`,
    },
    itemRows,
    grandTotal,
    savedAt: new Date().toISOString(),
  };
}

export function mapReceivingToReceiptReport(
  receiving: ReceiptReportRecord,
  request: InventoryRequest
): OfficialFormSharedData {
  const itemRows: OfficialFormSharedData["itemRows"] = (receiving.receivedItems || request.items || []).map(
    (item: any, idx: number) => ({
      serial: String(idx + 1),
      itemName: item.itemName || item.name || "",
      itemType: item.itemType || item.specifications || "",
      itemNameType: item.itemName || item.name || "",
      quantity: String(item.quantity || item.receivedQuantity || ""),
      unit: item.unit || "",
      unitPrice: String(item.unitPrice || ""),
      totalPrice: String(item.totalPrice || ""),
    })
  );

  const grandTotal = itemRows.reduce((s, item) => {
    const n = parseFloat(item.totalPrice || "0");
    return s + (isFinite(n) ? n : 0);
  }, 0);

  return {
    sourceTemplateId: "formTemplate4",
    sourceFormName: "receiptReport",
    sharedFields: {
      ...extractSharedRequestData(request),
      v7ProposalSubject: `${receiving.vendorName} - ${request.reason || ""}`,
    },
    itemRows,
    grandTotal,
    savedAt: new Date().toISOString(),
  };
}

export function mapDeliveryToFS5(
  delivery: FS5Document,
  request: InventoryRequest
): OfficialFormSharedData {
  const itemRows: OfficialFormSharedData["itemRows"] = (delivery.items || request.items || []).map(
    (item: any, idx: number) => ({
      serial: String(idx + 1),
      itemName: item.itemName || item.name || "",
      itemType: item.itemType || item.specifications || "",
      itemNameType: item.itemName || item.name || "",
      quantity: String(item.quantity || item.deliveredQuantity || ""),
      unit: item.unit || "",
      unitPrice: String(item.unitPrice || ""),
      totalPrice: String(item.totalPrice || ""),
    })
  );

  return {
    sourceTemplateId: "formTemplate6",
    sourceFormName: "pc5",
    sharedFields: {
      ...extractSharedRequestData(request),
      v7RequesterName: delivery.receiverName || request.requesterName || "",
      v7FacultySelect: delivery.facultyName || request.faculty || "",
      v7ProposalSubject: request.reason || "",
    },
    itemRows,
    grandTotal: 0,
    savedAt: new Date().toISOString(),
  };
}

export function syncForwardOnly(
  requestId: string,
  sourceFormType: string,
  sharedData: OfficialFormSharedData
): void {
  const sourceIndex = FORM_ORDER.indexOf(sourceFormType);
  if (sourceIndex === -1) return;
  FORM_ORDER.forEach((targetFormType, targetIndex) => {
    if (targetIndex <= sourceIndex) return;
    applySharedDataToTargetForm(requestId, targetFormType, sharedData);
  });
}

export function applySharedDataToTargetForm(
  requestId: string,
  targetFormType: string,
  sharedData: OfficialFormSharedData
): void {
  const existing = loadOfficialFormData(requestId, targetFormType);
  const merged: OfficialFormSharedData = {
    ...existing,
    sharedFields: { ...sharedData.sharedFields, ...(existing?.sharedFields || {}) },
    itemRows: sharedData.itemRows,
    grandTotal: sharedData.grandTotal,
    savedAt: new Date().toISOString(),
  };
  saveOfficialFormData(requestId, targetFormType, merged);
}

export function buildAllFormsData(
  request: InventoryRequest,
  vendorOffers?: VendorOffer[],
  receiptReport?: ReceiptReportRecord | null,
  fs5?: FS5Document | null
): Record<string, OfficialFormSharedData> {
  const result: Record<string, OfficialFormSharedData> = {};

  result["formTemplate0"] = mapRequestToProposal(request);
  result["formTemplate5"] = mapRequestToSI9(request);

  if (vendorOffers && vendorOffers.length > 0) {
    result["formTemplate1"] = {
      sourceTemplateId: "formTemplate1",
      sourceFormName: "tender",
      sharedFields: extractSharedRequestData(request),
      itemRows: extractSharedItemRows(request.items),
      grandTotal: 0,
      savedAt: new Date().toISOString(),
    };
    result["formTemplate2"] = mapVendorOffersToComparison(vendorOffers, request.items);

    const winner = selectWinningVendor(vendorOffers);
    if (winner) {
      result["formTemplate3"] = mapWinnerToPurchaseOrder(winner, request);
    }
  }

  if (receiptReport) {
    result["formTemplate4"] = mapReceivingToReceiptReport(receiptReport, request);
  }

  if (fs5) {
    result["formTemplate6"] = mapDeliveryToFS5(fs5, request);
  }

  return result;
}

export function connectFormSaveToProgressTracking(
  _requestId: string,
  _formType: string,
  _stage: string
): void {
  // Progress tracking is handled by the existing request workflow.
  // Form saves are independent and do not directly trigger stage changes.
  // Stage changes happen through the Requests/Procurement/Receiving workflows.
}

export { TEMPLATE_TO_FORM, FORM_ORDER };
