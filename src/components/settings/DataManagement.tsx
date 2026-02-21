import { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { exportAllData, importAllData, resetAllData } from '../../lib/storage';

export function DataManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unlock-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      importAllData(text);
      setImportStatus('Data imported successfully. Reload the page to see changes.');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setImportStatus('Failed to import data. Invalid file format.');
    }
  };

  const handleReset = () => {
    resetAllData();
    setShowResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Data Management</h2>

      <Card className="flex flex-col gap-3">
        <Button variant="secondary" onClick={handleExport} icon={<Download size={16} />}>
          Export Data
        </Button>

        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          icon={<Upload size={16} />}
        >
          Import Data
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />

        {importStatus && (
          <p className="text-sm text-text-secondary">{importStatus}</p>
        )}

        <Button variant="danger" onClick={() => setShowResetConfirm(true)} icon={<Trash2 size={16} />}>
          Reset All Data
        </Button>
      </Card>

      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset All Data?"
      >
        <p className="text-text-secondary mb-4">
          This will permanently delete all your data including your profile, tasks, history, and settings.
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowResetConfirm(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReset} className="flex-1">
            Delete Everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}
