import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";

export type OfficialTemplateId =
  | "formTemplate0"
  | "formTemplate1"
  | "formTemplate2"
  | "formTemplate3"
  | "formTemplate4"
  | "formTemplate5"
  | "formTemplate6";

export interface OfficialFormSharedData {
  sourceTemplateId?: string;
  sourceFormName?: string;
  sharedFields?: Record<string, string>;
  itemRows?: Array<{
    serial?: string;
    itemName?: string;
    itemType?: string;
    itemNameType?: string;
    quantity?: string;
    unit?: string;
    unitPrice?: string;
    totalPrice?: string;
  }>;
  grandTotal?: number;
  savedAt?: string;
}

interface OfficialFormViewerProps {
  templateId: OfficialTemplateId;
  requestId?: string;
  allFormsData?: Record<string, OfficialFormSharedData>;
  initialData?: OfficialFormSharedData;
  onSave?: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
}

const ZOOM_MIN = 40;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;
const ZOOM_DEFAULT = 100;

const OfficialFormViewer: React.FC<OfficialFormViewerProps> = ({
  templateId,
  requestId,
  allFormsData,
  initialData,
  onSave,
  readOnly = false,
}) => {
  const { pick } = useLanguage();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const pendingSaveCb = useRef<((data: Record<string, unknown>) => void) | null>(null);
  const lastTemplateId = useRef<string>("");
  const lastRequestId = useRef<string>("");
  const lastAllFormsData = useRef<Record<string, OfficialFormSharedData> | undefined>(undefined);

  const sendMsg = useCallback((msg: Record<string, unknown>) => {
    try {
      iframeRef.current?.contentWindow?.postMessage({ namespace: "KU_FORMS", ...msg }, "*");
    } catch (_) {}
  }, []);

  // ── Apply zoom to the inner #formViewer inside official-forms.html ──────────
  const applyZoom = useCallback((zoomPct: number) => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const viewer = doc.getElementById("formViewer") as HTMLIFrameElement | null;
      if (viewer) {
        viewer.style.zoom = `${zoomPct}%`;
        // Expand wrapper height so the zoomed content isn't clipped
        const card = doc.querySelector(".viewer-card") as HTMLElement | null;
        if (card) {
          if (zoomPct >= 100) {
            card.style.height = "";
            card.style.overflow = "hidden";
          } else {
            card.style.overflow = "hidden";
          }
        }
      }
    } catch (_) {}
  }, []);

  // ── Height chain fix ─────────────────────────────────────────────────────────
  const injectHeightFix = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc?.head) return;
      if (doc.getElementById("ku-wms-height-fix")) return;
      const style = doc.createElement("style");
      style.id = "ku-wms-height-fix";
      style.textContent =
        "html,body,.app-shell{height:100%!important;min-height:0!important;}" +
        ".viewer-wrap{display:flex!important;flex-direction:column!important;height:100%!important;min-height:0!important;overflow:hidden!important;}" +
        ".viewer-card{flex:1!important;min-height:0!important;overflow:hidden!important;}" +
        "#formViewer{width:100%!important;height:100%!important;border:0!important;display:block!important;}";
      doc.head.appendChild(style);
    } catch (_) {}
  }, []);

  useLayoutEffect(() => {
    const keysToClean = [
      "proposal_v7_balanced_hard_save",
      "proposal_v7_balanced_hard_backup",
      "proposal_v7_balanced_content",
      "proposal_v7_balanced_ultimate_content",
      "proposal_v7_balanced_word_like_content",
      "proposal_v7_balanced_history_content",
      "proposal_safe_rebuild_v3_content",
      "proposal_integrated_final_v2_content",
      "proposal_hard_save_final_content_v1",
      "proposal_hard_save_final_content_backup_v1",
      "proposal_hard_fixed_content_v3",
      "ku-final-saved-html-formTemplate0",
      "ku_procurement_single_file_formTemplate0_snapshot_v3",
      "procurement_form_proposal",
    ];
    try { keysToClean.forEach((k) => localStorage.removeItem(k)); } catch (_) {}
  }, [requestId]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data as Record<string, unknown>;
      if (!msg || msg.namespace !== "KU_FORMS") return;
      if (msg.type === "DATA_RESPONSE" && pendingSaveCb.current) {
        pendingSaveCb.current(msg.data as Record<string, unknown>);
        pendingSaveCb.current = null;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const setupIframe = useCallback(
    (tid: string, rid: string | undefined) => {
      injectHeightFix();
      sendMsg({ type: "HIDE_TOPBAR" });
      setTimeout(() => applyZoom(zoom), 200);

      if (rid) sendMsg({ type: "SET_REQUEST_SCOPE", requestId: rid });

      sendMsg({ type: "SHOW_FORM", templateId: tid });

      if (allFormsData && Object.keys(allFormsData).length > 0) {
        setTimeout(() => sendMsg({ type: "INJECT_ALL_FORMS", allData: allFormsData }), 500);
      } else if (initialData && Object.keys(initialData).length > 0) {
        setTimeout(() => sendMsg({ type: "INJECT_DATA", templateId: tid, sharedData: initialData }), 500);
      }

      if (readOnly) {
        setTimeout(() => sendMsg({ type: "SET_READONLY" }), 1000);
      }
    },
    [allFormsData, initialData, readOnly, sendMsg, injectHeightFix, applyZoom, zoom]
  );

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
    setIframeReady(true);
    const tid = templateId;
    const rid = requestId;
    lastTemplateId.current = tid;
    lastRequestId.current = rid || "";
    lastAllFormsData.current = allFormsData;
    setTimeout(() => setupIframe(tid, rid), 350);
  }, [templateId, requestId, allFormsData, setupIframe]);

  useEffect(() => {
    if (!iframeReady) return;
    const tid = templateId;
    if (tid === lastTemplateId.current) return;
    lastTemplateId.current = tid;
    sendMsg({ type: "SHOW_FORM", templateId: tid });
    if (initialData && Object.keys(initialData).length > 0) {
      setTimeout(() => sendMsg({ type: "INJECT_DATA", templateId: tid, sharedData: initialData }), 350);
    }
  }, [templateId, iframeReady, initialData, sendMsg]);

  useEffect(() => {
    if (!iframeReady) return;
    if (allFormsData === lastAllFormsData.current) return;
    lastAllFormsData.current = allFormsData;
    if (!allFormsData || Object.keys(allFormsData).length === 0) return;
    sendMsg({ type: "SHOW_FORM", templateId });
    setTimeout(() => sendMsg({ type: "INJECT_ALL_FORMS", allData: allFormsData }), 500);
  }, [allFormsData, iframeReady, templateId, sendMsg]);

  // Re-apply zoom whenever it changes (after iframe is ready)
  useEffect(() => {
    if (!iframeReady) return;
    applyZoom(zoom);
  }, [zoom, iframeReady, applyZoom]);

  const handleZoomIn = () =>
    setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) / ZOOM_STEP) * ZOOM_STEP));
  const handleZoomOut = () =>
    setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) / ZOOM_STEP) * ZOOM_STEP));
  const handleZoomReset = () => setZoom(ZOOM_DEFAULT);

  const handleSave = () => {
    if (!onSave) return;
    pendingSaveCb.current = onSave;
    sendMsg({ type: "GET_DATA", msgId: Date.now().toString() });
    setTimeout(() => {
      if (pendingSaveCb.current) {
        pendingSaveCb.current({});
        pendingSaveCb.current = null;
      }
    }, 4000);
  };

  const handlePrint = () => sendMsg({ type: "PRINT" });

  const zoomBarWidth = ((zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100;

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* ── Top toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b bg-gray-50">
        <h3 className="text-sm font-bold text-gray-700">{pick("رسمي فورم", "فورم رسمی")}</h3>

        {/* ── Zoom bar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5" dir="ltr">
          {/* Zoom-out */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= ZOOM_MIN}
            title="کوچنی کول"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-base font-bold hover:bg-blue-50 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            −
          </button>

          {/* Slider track */}
          <div className="relative flex items-center w-28 sm:w-36 h-7 cursor-pointer group"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const raw = ZOOM_MIN + ratio * (ZOOM_MAX - ZOOM_MIN);
              const snapped = Math.round(raw / ZOOM_STEP) * ZOOM_STEP;
              setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, snapped)));
            }}
          >
            {/* Track background */}
            <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-150"
                style={{ width: `${zoomBarWidth}%` }}
              />
            </div>
            {/* Hidden range input for keyboard/drag support */}
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              aria-label="Zoom"
            />
            {/* Thumb */}
            <div
              className="absolute w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-sm transition-all duration-150 pointer-events-none"
              style={{ left: `calc(${zoomBarWidth}% - 8px)` }}
            />
          </div>

          {/* Zoom-in */}
          <button
            onClick={handleZoomIn}
            disabled={zoom >= ZOOM_MAX}
            title="لوی کول"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-base font-bold hover:bg-blue-50 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            +
          </button>

          {/* Percentage badge — click to reset */}
          <button
            onClick={handleZoomReset}
            title={pick("۱۰۰٪ ته راستول", "بازگشت به ۱۰۰٪")}
            className="min-w-[3.2rem] h-7 px-2 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-400 transition tabular-nums"
          >
            {zoom}%
          </button>
        </div>

        {/* ── Action buttons ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
              🔒 {pick("د لیدلو حالت", "فقط مشاهده")}
            </span>
          )}
          {!readOnly && onSave && (
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition"
            >
              {pick("ذخیره کول", "ذخیره")}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 transition"
          >
            {pick("چاپ کول", "چاپ")}
          </button>
        </div>
      </div>

      {/* ── Iframe ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"
            style={{ height: "max(820px, calc(100vh - 160px))" }}
          >
            <span className="text-sm text-gray-500">بارول...</span>
          </div>
        )}
        <iframe
          key={requestId || "no-request"}
          ref={iframeRef}
          src="/forms/official-forms.html?v=si9-2page"
          className="w-full border-0 block"
          style={{ height: "max(820px, calc(100vh - 160px))" }}
          title="Official Form"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
};

export default OfficialFormViewer;
