'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { synapseApi } from '@/services/api';
import { FileText, Download, Maximize2, Minimize2, Loader2, AlertCircle, FileWarning } from 'lucide-react';

interface DocumentPreviewProps {
  documentId: string;
  defaultFormat?: 'html' | 'pdf';
  highlightChanges?: boolean;
  className?: string;
  hasPdf?: boolean;
}

export function DocumentPreview({
  documentId,
  defaultFormat = 'html',
  highlightChanges = false,
  className = '',
  hasPdf = false,
}: DocumentPreviewProps) {
  const [format, setFormat] = useState<'html' | 'pdf'>(defaultFormat);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Only fetch if format is html OR if pdf is available
  const shouldFetch = format === 'html' || hasPdf;

  const { data, isLoading, error } = useQuery({
    queryKey: ['document-preview', documentId, format],
    queryFn: () => synapseApi.documents.preview(documentId, format),
    enabled: !!documentId && shouldFetch,
  });

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1/synapse/documents/${documentId}/download`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `document-${documentId}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Show PDF not available message instead of error
  const showPdfNotAvailable = format === 'pdf' && !hasPdf;

  if (error && !showPdfNotAvailable) {
    return (
      <div className={`card p-8 text-center ${className}`}>
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
        <p className="text-gray-600 mb-2">Failed to load document preview</p>
        <p className="text-sm text-gray-400">{(error as Error).message}</p>
      </div>
    );
  }

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-white flex flex-col'
    : `card overflow-hidden ${className}`;

  return (
    <div className={containerClasses}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Document Preview</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Format Toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setFormat('html')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                format === 'html'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              HTML
            </button>
            <button
              onClick={() => setFormat('pdf')}
              disabled={!hasPdf}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                format === 'pdf'
                  ? 'bg-blue-500 text-white'
                  : hasPdf 
                    ? 'bg-white text-gray-600 hover:bg-gray-50'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={!hasPdf ? 'PDF not available for this document' : 'View PDF'}
            >
              PDF
            </button>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!hasPdf}
            className={`p-2 rounded-lg transition-colors ${
              hasPdf 
                ? 'hover:bg-gray-100 text-gray-600' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={hasPdf ? 'Download PDF' : 'PDF not available'}
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className={`flex-1 overflow-auto bg-gray-100 ${isFullscreen ? '' : 'h-[600px]'}`}>
        {showPdfNotAvailable ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileWarning className="h-12 w-12 mx-auto mb-3 text-amber-400" />
              <p className="text-gray-600 mb-2">PDF not available</p>
              <p className="text-sm text-gray-400">This document has not been converted to PDF yet.</p>
              <button
                onClick={() => setFormat('html')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View HTML Version
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
              <p className="text-gray-500">Loading preview...</p>
            </div>
          </div>
        ) : data?.content ? (
          format === 'html' ? (
            <div className="p-4">
              <div
                className={`bg-white shadow-lg mx-auto max-w-4xl p-8 ${
                  highlightChanges ? 'document-diff' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            </div>
          ) : (
            <iframe
              src={`data:application/pdf;base64,${data.content}`}
              className="w-full h-full"
              title="Document Preview"
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No preview available</p>
            </div>
          </div>
        )}
      </div>

      {/* Diff Highlighting Styles */}
      {highlightChanges && (
        <style jsx global>{`
          .document-diff del {
            background-color: #fee2e2;
            text-decoration: line-through;
            color: #991b1b;
          }
          .document-diff ins {
            background-color: #dcfce7;
            text-decoration: none;
            color: #166534;
            font-weight: 600;
          }
          .document-diff .change-marker {
            display: inline-block;
            padding: 0 4px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-left: 4px;
          }
          .document-diff .change-marker.removed {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .document-diff .change-marker.added {
            background-color: #dcfce7;
            color: #166534;
          }
        `}</style>
      )}
    </div>
  );
}

// Standalone preview component for simple use cases
export function SimpleDocumentPreview({ content, format = 'html' }: { content: string; format?: 'html' | 'pdf' }) {
  if (format === 'pdf') {
    return (
      <iframe
        src={`data:application/pdf;base64,${content}`}
        className="w-full h-[600px] border rounded-lg"
        title="Document Preview"
      />
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

export default DocumentPreview;
