import { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CategoryStepProps {
  categories: string[];
  setCategories: (categories: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CategoryStep({ categories, setCategories, onNext, onBack }: CategoryStepProps) {
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setError('Category already exists');
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCategory('');
    setError('');
  };

  const handleRemove = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Tag size={32} className="text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Task Categories</h2>
          <p className="text-text-muted text-sm max-w-sm">
            Choose or customize the categories you'll use to organize your tasks. You can always change these later in settings.
          </p>
        </div>

        <div className="w-full flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <span
              key={category}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface text-sm text-text-secondary"
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
        </div>

        <div className="w-full flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Add a category"
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
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
