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
  readOnly = false 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForm();
  }, [templateId]);

  const loadForm = async () => {
    setLoading(true);
    try {
      const response = await fetch("/forms/official-forms.html");
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const template = doc.getElementById(templateId) as HTMLTemplateElement;

      if (template && iframeRef.current) {
        const iframe = iframeRef.current;
        const formHtml = template.innerHTML;
        
        // Inject script to handle data binding and read-only mode
        const bridgeScript = `
          <script>
            window.getFormData = function() {
              const data = {};
              document.querySelectorAll('input, textarea, select').forEach(el => {
                if (el.id || el.name) {
                  data[el.id || el.name] = el.type === 'checkbox' ? el.checked : el.value;
                }
              });
              return data;
            };

            window.setFormData = function(data) {
              if (!data) return;
              Object.keys(data).forEach(key => {
                const el = document.getElementById(key) || document.querySelector('[name="' + key + '"]');
                if (el) {
                  if (el.type === 'checkbox') el.checked = data[key];
                  else el.value = data[key];
                }
              });
            };

            if (${readOnly}) {
              document.querySelectorAll('input, textarea, select').forEach(el => {
                el.disabled = true;
              });
              // Hide action buttons in the form if any
              document.querySelectorAll('button').forEach(btn => {
                if (!btn.classList.contains('print-btn')) btn.style.display = 'none';
              });
            }

            // Sync initial data if provided
            setTimeout(() => {
              window.setFormData(${JSON.stringify(initialData)});
            }, 500);
          </script>
        `;

        iframe.srcdoc = formHtml + bridgeScript;
      }
    } catch (error) {
      console.error("Error loading official form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (iframeRef.current && onSave) {
      const iframeWindow = iframeRef.current.contentWindow;
      if (iframeWindow && (iframeWindow as any).getFormData) {
        const data = (iframeWindow as any).getFormData();
        onSave(data);
      }
    }
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
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
        <iframe 
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Official Form"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
};

export default OfficialFormViewer;
