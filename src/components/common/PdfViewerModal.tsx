import React, { useEffect, useState } from 'react';
import { X, Download, FileText, ExternalLink, RefreshCw } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  fileUrl,
}) => {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (!isOpen || !fileUrl) {
      setBlobUrl('');
      return;
    }

    // Convert Base64 data URL to an accessible local blob url to avoid security/iframe blockages
    if (fileUrl.startsWith('data:')) {
      setIsConverting(true);
      try {
        const parts = fileUrl.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'application/pdf';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        console.error('Error generating blob URL:', err);
        setBlobUrl(fileUrl); // fallback
      } finally {
        setIsConverting(false);
      }
    } else {
      setBlobUrl(fileUrl);
    }

    return () => {
      // Cleanup object URL on unmount or fileUrl change
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, fileUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" id="pdf-viewer-modal">
      <div className="relative max-w-5xl w-full h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold text-white truncate">{title}</h3>
              <p className="text-[10px] text-slate-400">Visor de Documentos de BIMUN</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isConverting || !blobUrl}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Descargar PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
            <a
              href={blobUrl}
              target="_blank"
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content iframe area */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center relative">
          {isConverting ? (
            <div className="flex flex-col items-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-300">Preparando documento PDF...</p>
            </div>
          ) : blobUrl ? (
            <iframe
              src={`${blobUrl}#toolbar=1`}
              className="w-full h-full border-0"
              title={title}
            />
          ) : (
            <div className="text-center p-6 space-y-2">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Este documento no tiene un archivo PDF adjunto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
