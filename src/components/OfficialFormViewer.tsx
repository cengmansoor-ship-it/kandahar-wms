import React, { useEffect, useRef, useState } from "react";

interface OfficialFormViewerProps {
  templateId: "formTemplate0" | "formTemplate1" | "formTemplate2" | "formTemplate3" | "formTemplate4" | "formTemplate5" | "formTemplate6";
  initialData?: any;
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

const OfficialFormViewer: React.FC<OfficialFormViewerProps> = ({
  templateId,
  initialData,
  onSave,
  readOnly = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState("");

  useEffect(() => {
    const url = `/forms/official-forms.html?embed=1&form=${encodeURIComponent(templateId)}`;
    setSrc(url);
    setLoading(true);
  }, [templateId]);

  const handleLoad = () => {
    setLoading(false);

    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const win = iframe.contentWindow as any;
      if (!win) return;

      if (readOnly) {
        setTimeout(() => {
          try {
            const doc = iframe.contentDocument || win.document;
            if (!doc) return;
            doc.querySelectorAll("input, textarea, select").forEach((el: any) => {
              el.disabled = true;
            });
            doc.querySelectorAll("button").forEach((btn: any) => {
              const id = btn.id || "";
              if (!id.includes("print") && !id.includes("Print")) {
                btn.style.display = "none";
              }
            });
          } catch {}
        }, 600);
      }

      if (initialData && Object.keys(initialData).length > 0) {
        setTimeout(() => {
          try {
            const doc = iframe.contentDocument || win.document;
            if (!doc) return;
            Object.entries(initialData).forEach(([key, value]) => {
              const el = doc.getElementById(key) || doc.querySelector(`[name="${key}"]`);
              if (!el) return;
              const element = el as HTMLInputElement;
              if (element.type === "checkbox") {
                element.checked = Boolean(value);
              } else {
                element.value = String(value ?? "");
              }
            });
          } catch {}
        }, 800);
      }
    } catch {}
  };

  const handleSave = () => {
    if (!iframeRef.current || !onSave) return;
    try {
      const win = iframeRef.current.contentWindow as any;
      const doc = iframeRef.current.contentDocument || (win && win.document);
      if (!doc) return;
      const data: Record<string, any> = {};
      doc.querySelectorAll("input, textarea, select").forEach((el: any) => {
        const key = el.id || el.name;
        if (key) {
          data[key] = el.type === "checkbox" ? el.checked : el.value;
        }
      });
      onSave(data);
    } catch {}
  };

  const handlePrint = () => {
    try {
      iframeRef.current?.contentWindow?.print();
    } catch {}
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="text-sm font-bold text-gray-700">رسمي فورم / فورم رسمی</h3>
        <div className="flex gap-2">
          {!readOnly && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition"
            >
              ذخیره کول / ذخیره
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 transition"
          >
            چاپ کول / چاپ
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <span className="text-sm text-gray-500">بارول...</span>
          </div>
        )}
        {src && (
          <iframe
            ref={iframeRef}
            src={src}
            className="w-full h-full border-0"
            title="Official Form"
            onLoad={handleLoad}
          />
        )}
      </div>
    </div>
  );
};

export default OfficialFormViewer;
