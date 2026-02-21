import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useUserStore } from '../../store/useUserStore';

export function CategoryManager() {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  const categories = profile?.taskCategories ?? [];

  const handleAdd = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setError('Category already exists');
      return;
    }
    updateProfile({ taskCategories: [...categories, trimmed] });
    setNewCategory('');
    setError('');
  };

  const handleRemove = (category: string) => {
    updateProfile({ taskCategories: categories.filter((c) => c !== category) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Task Categories</h2>
      <p className="text-sm text-text-muted">Customize the categories available when creating tasks.</p>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-light text-sm text-text-secondary"
            >
              {category}
              <button
                onClick={() => handleRemove(category)}
                className="text-text-muted hover:text-danger transition-colors cursor-pointer"
                aria-label={`Remove ${category}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-text-muted">No categories yet.</p>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => { setNewCategory(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newCategory.trim()}
            className="shrink-0 px-3 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </Card>
    </div>
  );
}
