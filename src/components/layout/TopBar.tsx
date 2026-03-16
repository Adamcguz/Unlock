import { useState } from 'react';
import { Unlock, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Modal } from '../ui/Modal';
import { CreateTaskForm } from '../tasks/CreateTaskForm';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';

export function TopBar() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();
  const periods = usePayPeriodStore((s) => s.periods);
  const currentPeriodId = usePayPeriodStore((s) => s.currentPeriodId);
  const currentPeriod = periods.find((p) => p.id === currentPeriodId) ?? null;

  return (
    <>
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-surface-light z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto h-14 px-4">
          <div className="flex items-center gap-2">
            <Unlock size={22} className="text-primary" />
            <span className="text-lg font-bold">Unlock</span>
          </div>
          <div className="flex items-center gap-2">
            {currentPeriod && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
                aria-label="New Task"
              >
                <Plus size={18} />
              </button>
            )}
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {currentPeriod && (
        <Modal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          title="Create Task"
        >
          <CreateTaskForm
            periodId={currentPeriod.id}
            onCreated={() => setShowCreateForm(false)}
          />
        </Modal>
      )}
    </>
  );
}
