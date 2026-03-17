import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { usePlaidStore } from '../../store/usePlaidStore';
import { useDebtStore } from '../../store/useDebtStore';
import { parseCSVFile } from '../../lib/csvParser';
import type { PlaidTransaction } from '../../types/plaid';
import { format } from 'date-fns';

interface PreviewData {
  transactions: PlaidTransaction[];
  bankName: string;
  dateRange: { start: string; end: string };
  fileName: string;
  latestBalance: number | null;
}

export function CsvImport() {
  const { csvImported, csvFileName, transactions, clearCsvData, setCsvData } = usePlaidStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file (.csv)');
      return;
    }

    setIsParsing(true);
    setError(null);
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target?.result as string;
      const result = parseCSVFile(raw);

      if (!result.success) {
        setError(result.error);
        setIsParsing(false);
        return;
      }

      setPreview({
        transactions: result.transactions,
        bankName: result.bankName,
        dateRange: result.dateRange,
        fileName: file.name,
        latestBalance: result.latestBalance,
      });
      setIsParsing(false);
    };
    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!preview) return;
    setCsvData(preview.transactions, preview.fileName);
    // Set account balance from CSV if available
    if (preview.latestBalance !== null) {
      useDebtStore.getState().setAccountBalance(preview.latestBalance);
    }
    setPreview(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // Already imported — show status
  if (csvImported && !preview) {
    return (
      <div className="bg-surface-light rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium">CSV Imported</span>
        </div>
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">File</span>
            <span>{csvFileName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Transactions</span>
            <span>{transactions.length}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-surface rounded-xl text-sm hover:bg-surface-lighter transition-colors"
          >
            <Upload className="w-4 h-4" />
            Re-import
          </button>
          <button
            onClick={clearCsvData}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 rounded-xl text-sm hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  // Preview state — show parsed data before confirming
  if (preview) {
    return (
      <div className="bg-surface-light rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-accent" />
          <div>
            <span className="text-sm font-medium">Ready to Import</span>
            <span className="text-xs text-text-muted ml-2">{preview.bankName}</span>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Transactions</span>
            <span>{preview.transactions.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Date Range</span>
            <span>
              {format(new Date(preview.dateRange.start), 'MMM d')} — {format(new Date(preview.dateRange.end), 'MMM d, yyyy')}
            </span>
          </div>
          {preview.latestBalance !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Account Balance</span>
              <span className="font-medium text-primary">${preview.latestBalance.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Sample transactions */}
        <div className="bg-surface rounded-xl p-3 mb-3 max-h-40 overflow-y-auto">
          <p className="text-xs text-text-muted mb-2">Sample transactions:</p>
          {preview.transactions.slice(0, 5).map((tx) => (
            <div key={tx.transactionId} className="flex justify-between text-xs py-1">
              <span className="truncate max-w-[140px]">{tx.merchantName || tx.name}</span>
              <span className={tx.amount > 0 ? 'text-danger' : 'text-primary'}>
                {tx.amount > 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setPreview(null)}
            className="flex-1 px-3 py-2 bg-surface rounded-xl text-sm hover:bg-surface-lighter transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import {preview.transactions.length} Transactions
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isParsing) {
    return (
      <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
        <p className="text-sm text-text-muted">Parsing transactions...</p>
      </div>
    );
  }

  // Default upload area
  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
          isDragging
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-accent/50 hover:bg-surface-light/50'
        }`}
      >
        <Upload className="w-6 h-6 text-text-muted" />
        <p className="text-sm font-medium">Import Bank CSV</p>
        <p className="text-xs text-text-muted text-center">
          Download transactions from your bank's website and upload the CSV file here
        </p>
        <p className="text-[10px] text-text-muted">
          Supports Truist, Chase, BofA, Capital One, Citi & more
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {error && (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-500/10 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
