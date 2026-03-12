import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { getMonthDays, format } from '../../lib/dateUtils';
import { calculateTotalBills } from '../../lib/calculations';
import { formatCurrency } from '../../lib/dateUtils';
import { COMMON_BILL_PRESETS } from '../../lib/constants';
import { generateId } from '../../lib/storage';
import { getDate, endOfMonth } from 'date-fns';
import type { RecurringBill } from '../../types';

interface BillsCalendarStepProps {
  bills: RecurringBill[];
  setBills: (bills: RecurringBill[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BillsCalendarStep({ bills, setBills, onNext, onBack }: BillsCalendarStepProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDay, setBillDay] = useState(1);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);
  const firstDayOfWeek = days[0].getDay();
  const lastDayOfMonth = getDate(endOfMonth(new Date(year, month)));

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const getBillsForDay = useMemo(() => {
    const map = new Map<number, RecurringBill[]>();
    for (const bill of bills) {
      const effectiveDay = Math.min(bill.dayOfMonth, lastDayOfMonth);
      const existing = map.get(effectiveDay) ?? [];
      existing.push(bill);
      map.set(effectiveDay, existing);
    }
    return map;
  }, [bills, lastDayOfMonth]);

  const getDayTotal = (dayNum: number) => {
    const dayBills = getBillsForDay.get(dayNum);
    if (!dayBills) return 0;
    return dayBills.reduce((sum, b) => sum + b.amount, 0);
  };

  const selectedBills = selectedDay ? (getBillsForDay.get(selectedDay) ?? []) : [];
  const totalBills = calculateTotalBills(bills);

  const openAddModal = (day: number) => {
    setEditingBill(null);
    setBillName('');
    setBillAmount('');
    setBillDay(day);
    setShowModal(true);
  };

  const openEditModal = (bill: RecurringBill) => {
    setEditingBill(bill);
    setBillName(bill.name);
    setBillAmount(String(bill.amount));
    setBillDay(bill.dayOfMonth);
    setShowModal(true);
  };

  const handleSaveBill = () => {
    if (!billName.trim() || !billAmount) return;
    const amount = Number(billAmount);
    if (amount <= 0) return;

    if (editingBill) {
      setBills(bills.map((b) =>
        b.id === editingBill.id
          ? { ...b, name: billName.trim(), amount, dayOfMonth: billDay }
          : b
      ));
    } else {
      setBills([...bills, {
        id: generateId(),
        name: billName.trim(),
        amount,
        dayOfMonth: billDay,
      }]);
    }
    setShowModal(false);
    setSelectedDay(billDay <= lastDayOfMonth ? billDay : lastDayOfMonth);
  };

  const handleDeleteBill = (billId: string) => {
    setBills(bills.filter((b) => b.id !== billId));
  };

  const handleDayClick = (dayNum: number) => {
    const hasBills = getBillsForDay.has(dayNum);
    if (hasBills) {
      setSelectedDay((prev) => (prev === dayNum ? null : dayNum));
    } else {
      openAddModal(dayNum);
    }
  };

  // Presets not yet used by existing bills
  const availablePresets = COMMON_BILL_PRESETS.filter(
    (p) => !bills.some((b) => b.name === p)
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">When are your bills due?</h2>
          <p className="text-text-secondary">
            Tap a day to add a recurring bill on that date.
          </p>
        </div>

        {/* Calendar */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 text-text-muted hover:text-text-primary cursor-pointer">
              <ChevronLeft size={20} />
            </button>
            <span className="font-medium">{format(currentDate, 'MMMM yyyy')}</span>
            <button onClick={nextMonth} className="p-1 text-text-muted hover:text-text-primary cursor-pointer">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-xs text-text-muted py-1 font-medium">
                {d}
              </div>
            ))}

            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {days.map((day) => {
              const dayNum = day.getDate();
              const hasBills = getBillsForDay.has(dayNum);
              const isSelected = selectedDay === dayNum;
              const dayTotal = getDayTotal(dayNum);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(dayNum)}
                  className={`
                    relative py-2 rounded-lg text-sm transition-colors cursor-pointer
                    ${isSelected ? 'bg-primary/30 text-primary font-bold' : hasBills ? 'bg-danger/15 text-danger font-medium' : 'text-text-secondary hover:bg-surface-light'}
                  `}
                >
                  {dayNum}
                  {hasBills && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-danger">
                      ${dayTotal}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected day detail */}
        {selectedDay && selectedBills.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Bills on the {selectedDay}{getOrdinalSuffix(selectedDay)}</h3>
              <button
                onClick={() => openAddModal(selectedDay)}
                className="text-primary text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {selectedBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between bg-surface-light rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm font-medium">{bill.name}</span>
                    <span className="text-sm text-danger ml-2">{formatCurrency(bill.amount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(bill)}
                      className="p-1.5 text-text-muted hover:text-text-primary cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="p-1.5 text-text-muted hover:text-danger cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Total */}
        <div className="bg-surface-light rounded-xl p-3 flex items-center justify-between">
          <span className="text-text-secondary font-medium">Total Monthly Bills</span>
          <span className="text-lg font-bold">{formatCurrency(totalBills)}</span>
        </div>

        {bills.length === 0 && (
          <p className="text-sm text-text-muted text-center">
            No bills added yet. Tap any day on the calendar to get started, or continue if you have no fixed bills.
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-6 sticky bottom-0 bg-background py-4">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <Button onClick={onNext} className="flex-1" icon={<ArrowRight size={16} />}>
          Continue
        </Button>
      </div>

      {/* Add/Edit Bill Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingBill ? 'Edit Bill' : 'Add Bill'}>
        <div className="flex flex-col gap-4">
          <Input
            label="Bill Name"
            placeholder="e.g., Rent"
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
            autoFocus
          />

          {!editingBill && availablePresets.length > 0 && !billName && (
            <div className="flex flex-wrap gap-2">
              {availablePresets.slice(0, 6).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBillName(preset)}
                  className="text-xs bg-surface-light text-text-secondary px-2.5 py-1.5 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          <Input
            label="Amount"
            prefix="$"
            type="number"
            min={0}
            step={10}
            placeholder="0"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
          />

          <Input
            label="Day of Month"
            type="number"
            min={1}
            max={31}
            value={billDay}
            onChange={(e) => setBillDay(Math.max(1, Math.min(31, Number(e.target.value))))}
          />

          <Button
            onClick={handleSaveBill}
            disabled={!billName.trim() || !billAmount || Number(billAmount) <= 0}
          >
            {editingBill ? 'Save Changes' : 'Add Bill'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
