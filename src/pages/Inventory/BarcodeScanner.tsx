import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import jsQR from "jsqr";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { apiClient } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";
import { QRCodeSVG as QRCode } from "qrcode.react";

interface ScanResult {
  item: any;
  transactions: any[];
  auditLogs: any[];
}

function extractTrackingCode(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const code = url.searchParams.get("code");
    if (code && code.trim()) return code.trim();
  } catch (_) {}
  return trimmed;
}

export default function BarcodeScanner() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  const [searchParams] = useSearchParams();

  const canAccess = profile?.role === ROLES.SUPER_ADMIN || profile?.role === ROLES.ADMIN || profile?.role === ROLES.WAREHOUSE_DIRECTOR;
  const isSuperAdmin = profile?.role === ROLES.SUPER_ADMIN;

  const handleSearch = useCallback(async (rawCode: string) => {
    const code = extractTrackingCode(rawCode);
    if (!code) return;
    setLoading(true);
    setError(null);
    setScanResult(null);
    try {
      const data = await apiClient.get(`/inventory/barcode/${encodeURIComponent(code)}`);
      setScanResult(data);
    } catch (err: any) {
      setError(err.message?.includes("404") || err.message?.includes("ونه موندل شو")
        ? `جنس ونه موندل شو. کوډ "${code}" د سیستم کې نشته.`
        : `خطا: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("ستاسې براوزر د کیمرې ملاتړ نه کوي.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();
      setCameraActive(true);
      setScanning(true);

      scanningRef.current = true;

      const tick = () => {
        if (!scanningRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas || !video || video.readyState < video.HAVE_ENOUGH_DATA) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (found && found.data) {
            const extracted = extractTrackingCode(found.data);
            stopCamera();
            setManualCode(extracted);
            handleSearch(extracted);
            return;
          }
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError("د کیمرې اجازه ورکړل شوې نده. مهرباني وکړئ د براوزر ترتیباتو کې د کیمرې اجازه ورکړئ.");
      } else if (err.name === "NotFoundError") {
        setCameraError("کیمره ونه موندل شوه. مهرباني وکړئ ترکینګ کوډ لاندې دننه کړئ.");
      } else {
        setCameraError("کیمره پرانیستل ونشول: " + err.message);
      }
    }
  }, [handleSearch, stopCamera]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl && codeFromUrl.trim()) {
      const extracted = extractTrackingCode(codeFromUrl.trim());
      setManualCode(extracted);
      handleSearch(extracted);
    }
  }, [searchParams, handleSearch]);

  const handlePrint = async () => {
    if (!scanResult?.item) return;
    try {
      await apiClient.post(`/inventory/items/${scanResult.item.id}/barcode/print-log`, {});
    } catch (_) {}
    window.print();
  };

  const handleRegenerate = async () => {
    if (!scanResult?.item || !isSuperAdmin) return;
    if (!window.confirm("ایا د بارکوډ بیا جوړول غواړئ؟")) return;
    try {
      const res = await apiClient.post(`/inventory/items/${scanResult.item.id}/barcode/regenerate`, {});
      setScanResult(prev => prev ? {
        ...prev,
        item: { ...prev.item, tracking_code: res.tracking_code }
      } : prev);
      alert("بارکوډ بیا جوړ شو: " + res.tracking_code);
    } catch (err: any) {
      alert("خطا: " + err.message);
    }
  };

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-8 text-center" dir="rtl">
        <p className="text-red-700 dark:text-red-400 font-semibold text-lg">لاسرسی نشته</p>
        <p className="text-red-600 dark:text-red-300 mt-2 text-sm">تاسې د دې پاڼې لیدلو صلاحیت نه لرئ.</p>
        <Button className="mt-4" onClick={() => navigate("/inventory/items")}>بیرته</Button>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="د بارکوډ سکین | Kandahar University WMS" description="د جنس بارکوډ سکین او معلومات" />
      <Breadcrumb pageTitle="د بارکوډ سکین / اسکن بارکد" />

      <canvas ref={canvasRef} className="hidden" />

      <div className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90" dir="rtl">
            د بارکوډ / QR کوډ سکین یا لټون
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Manual search */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right" dir="rtl">
                د ترکینګ کوډ لارو پیل دننه کړئ
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch(manualCode)}
                  placeholder="KDR-WMS-2026-000001"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  dir="ltr"
                />
                <Button onClick={() => handleSearch(manualCode)} disabled={loading || !manualCode.trim()}>
                  {loading ? "لټون..." : "لټون"}
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-right" dir="rtl">د جنس کوډ، ترکینګ کوډ، یا بارکوډ ولیکئ</p>
            </div>

            {/* Camera scanning */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right" dir="rtl">
                د کیمرې له لارې سکین
              </label>
              {cameraActive ? (
                <div className="space-y-2">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-black"
                      style={{ maxHeight: 220 }}
                    />
                    {scanning && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-40 h-40 border-2 border-primary rounded-lg opacity-70">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400" dir="rtl">
                    📷 QR کوډ د کیمرې مخې ته ونیسئ...
                  </p>
                  <Button variant="outline" onClick={stopCamera} className="w-full">کیمره بنده کړئ</Button>
                </div>
              ) : (
                <Button onClick={startCamera} className="w-full" variant="outline">
                  📷 کیمره پرانیستل
                </Button>
              )}
              {cameraError && (
                <p className="text-xs text-red-500 text-right" dir="rtl">{cameraError}</p>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10 p-4 text-center" dir="rtl">
            <p className="text-blue-700 dark:text-blue-400 text-sm">لټون کیږي...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-4 text-right" dir="rtl">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {scanResult && (
          <div className="space-y-4 print:space-y-4">
            <div className="rounded-2xl border border-green-200 bg-white dark:border-green-900/30 dark:bg-white/[0.03] p-5 print:border print:border-gray-300 print:p-4">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4 print:hidden">
                <h3 className="text-base font-bold text-green-700 dark:text-green-400" dir="rtl">✓ جنس وموندل شو</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handlePrint} variant="outline" className="text-sm">
                    🖨️ د بارکوډ چاپ / چاپ بارکد
                  </Button>
                  {isSuperAdmin && (
                    <Button onClick={handleRegenerate} variant="outline" className="text-sm text-orange-600 border-orange-300 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20">
                      🔄 بارکوډ بیا جوړول
                    </Button>
                  )}
                </div>
              </div>

              <div className="print:block print:text-center print:mb-4 hidden">
                <p className="text-xs font-bold">د کندهار پوهنتون د عمومي ګدام مدیریت سیستم</p>
                <p className="text-xs text-gray-500">Kandahar University WMS</p>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="p-3 bg-white rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <QRCode
                      value={scanResult.item.tracking_code || scanResult.item.item_code || "N/A"}
                      size={120}
                      level="M"
                      includeMargin
                    />
                  </div>
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400 text-center font-bold">
                    {scanResult.item.tracking_code || scanResult.item.item_code}
                  </p>
                </div>

                <div className="flex-1 overflow-x-auto" dir="rtl">
                  <table className="w-full text-sm border-collapse">
                    <tbody>
                      {[
                        { label: "د جنس نوم", value: scanResult.item.name_ps || scanResult.item.name_fa },
                        { label: "د جنس کوډ", value: scanResult.item.item_code },
                        { label: "ترکینګ کوډ", value: scanResult.item.tracking_code },
                        { label: "کټګوري", value: scanResult.item.category_name },
                        { label: "نوعیت / مشخصات", value: scanResult.item.description },
                        { label: "واحد", value: scanResult.item.unit_name },
                        { label: "ګدام", value: scanResult.item.warehouse_name },
                        {
                          label: "اوسنۍ موجودي",
                          value: String(scanResult.item.current_stock ?? 0),
                          highlight: Number(scanResult.item.current_stock) === 0 ? "red" as const :
                            Number(scanResult.item.current_stock) <= Number(scanResult.item.minimum_stock) ? "orange" as const : "green" as const,
                        },
                        { label: "کمترین حد", value: String(scanResult.item.minimum_stock ?? 0) },
                        {
                          label: "قیمت",
                          value: scanResult.item.unit_price != null
                            ? `${Number(scanResult.item.unit_price).toLocaleString()} ؋`
                            : "—",
                        },
                        {
                          label: "د ثبت نیټه",
                          value: scanResult.item.created_at
                            ? new Date(scanResult.item.created_at).toLocaleDateString("fa-AF")
                            : "—",
                        },
                        { label: "چا ته ثبت دی", value: scanResult.item.assigned_to || "—" },
                        { label: "پوهنځی", value: scanResult.item.faculty || "—" },
                        { label: "ډیپارټمنټ", value: scanResult.item.department || "—" },
                        { label: "شخص", value: scanResult.item.person_name || "—" },
                        {
                          label: "وروستي حرکات",
                          value: scanResult.transactions.length > 0
                            ? `${scanResult.transactions[0]?.transaction_type === "IN" ? "داخل" : "خارج"} — ${scanResult.transactions[0]?.quantity} — ${scanResult.transactions[0]?.created_at ? new Date(scanResult.transactions[0].created_at).toLocaleDateString("fa-AF") : ""}`
                            : "هیڅ حرکت ثبت نه دی",
                        },
                        { label: "عرضه کوونکی", value: scanResult.item.supplier_source },
                        {
                          label: "حالت",
                          value: scanResult.item.current_stock === 0 ? "ختم شوی" :
                            scanResult.item.current_stock <= scanResult.item.minimum_stock ? "کمه موجودي" : "فعال",
                          highlight: scanResult.item.current_stock === 0 ? "red" as const :
                            scanResult.item.current_stock <= scanResult.item.minimum_stock ? "orange" as const : "green" as const,
                        },
                        { label: "د چاپ شمیر", value: String(scanResult.item.barcode_print_count ?? 0) },
                      ].map(({ label, value, highlight }) => {
                        const valClass = highlight === "red" ? "text-red-600 dark:text-red-400 font-bold" :
                          highlight === "orange" ? "text-orange-500 dark:text-orange-400 font-bold" :
                          highlight === "green" ? "text-green-600 dark:text-green-400 font-bold" :
                          "text-gray-800 dark:text-white/90";
                        return (
                          <tr key={label} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 pr-3 pl-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap w-36 bg-gray-50/60 dark:bg-gray-800/40 border-l border-gray-100 dark:border-gray-800">
                              {label}
                            </td>
                            <td className={`py-2 px-3 text-sm ${valClass}`}>
                              {value || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {scanResult.transactions.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 print:hidden">
                <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right" dir="rtl">
                  د موجودۍ معاملات ({scanResult.transactions.length})
                </h4>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm" dir="rtl">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">نوع</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">مقدار</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">پخوانۍ موجودي</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">نوې موجودي</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">یادښت</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">نیټه</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResult.transactions.map((tx: any, i: number) => (
                        <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="px-3 py-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              tx.transaction_type === "IN"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                              {tx.transaction_type === "IN" ? "داخل" : "خارج"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-800 dark:text-white/90 font-semibold">{tx.quantity}</td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{tx.previous_stock}</td>
                          <td className="px-3 py-2 text-gray-800 dark:text-white/90">{tx.new_stock}</td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">{tx.notes || "-"}</td>
                          <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">
                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString("fa-AF") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {scanResult.auditLogs.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 print:hidden">
                <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right" dir="rtl">
                  د فعالیتونو لوګ ({scanResult.auditLogs.length})
                </h4>
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-sm" dir="rtl">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">عمل</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">نیټه</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResult.auditLogs.map((log: any, i: number) => (
                        <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs font-mono">{log.action}</td>
                          <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">
                            {log.created_at ? new Date(log.created_at).toLocaleDateString("fa-AF") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body > *:not(.print\\:block) { display: none !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </>
  );
}

