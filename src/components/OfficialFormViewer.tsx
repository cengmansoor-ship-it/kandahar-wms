import React, { useEffect, useRef, useState, useCallback } from "react";

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

const OfficialFormViewer: React.FC<OfficialFormViewerProps> = ({
  templateId,
  requestId,
  allFormsData,
  initialData,
  onSave,
  readOnly = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);
  const pendingSaveCb = useRef<((data: Record<string, unknown>) => void) | null>(null);
  const lastTemplateId = useRef<string>("");
  const lastRequestId = useRef<string>("");
  const lastAllFormsData = useRef<Record<string, OfficialFormSharedData> | undefined>(undefined);

  const sendMsg = useCallback((msg: Record<string, unknown>) => {
    try {
      iframeRef.current?.contentWindow?.postMessage({ namespace: "KU_FORMS", ...msg }, "*");
    } catch (_) {}
  }, []);

  // ── Height chain fix ────────────────────────────────────────────────────────
  // official-forms.html uses `min-height: 100vh` on html/body/.app-shell instead
  // of `height: 100vh`. This means `.viewer-wrap { flex:1 }` and
  // `.viewer-card { height:100% }` never resolve to a concrete value, so
  // overflow:hidden clips the inner form iframe to near-zero.
  // Injecting height:100% directly into the outer iframe's DOM (same-origin) fixes
  // the entire chain without touching official-forms.html.
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

      if (rid) sendMsg({ type: "SET_REQUEST_SCOPE", requestId: rid });

      if (allFormsData && Object.keys(allFormsData).length > 0) {
        setTimeout(() => sendMsg({ type: "INJECT_ALL_FORMS", allData: allFormsData }), 400);
      } else if (initialData && Object.keys(initialData).length > 0) {
        setTimeout(() => sendMsg({ type: "INJECT_DATA", templateId: tid, sharedData: initialData }), 400);
      }

      if (readOnly) {
        setTimeout(() => sendMsg({ type: "SET_READONLY" }), 900);
      }
    },
    [allFormsData, initialData, readOnly, sendMsg, injectHeightFix]
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
    setTimeout(() => {
      sendMsg({ type: "INJECT_ALL_FORMS", allData: allFormsData });
      setTimeout(() => sendMsg({ type: "SHOW_FORM", templateId }), 200);
    }, 200);
  }, [allFormsData, iframeReady, templateId, sendMsg]);

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

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <h3 className="text-sm font-bold text-gray-700">رسمي فورم / فورم رسمی</h3>
        <div className="flex gap-2">
          {!readOnly && onSave && (
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition"
            >
              ذخیره کول
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 transition"
          >
            چاپ کول
          </button>
        </div>
      </div>
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
          src="/forms/official-forms.html"
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
