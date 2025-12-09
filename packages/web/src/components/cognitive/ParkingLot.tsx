import { useState } from 'react';
import { useCognitiveProfileStore } from '../../stores/cognitiveProfileStore';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { X, Plus, Lightbulb, Trash2 } from 'lucide-react';

interface ParkingLotItem {
  id: string;
  text: string;
  timestamp: Date;
}

export function ParkingLot() {
  const { settings } = useCognitiveProfileStore();
  const [items, setItems] = useState<ParkingLotItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  if (!settings.showParkingLot) return null;

  const addItem = () => {
    if (!newItemText.trim()) return;

    setItems([
      ...items,
      {
        id: Date.now().toString(),
        text: newItemText,
        timestamp: new Date(),
      },
    ]);
    setNewItemText('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    if (confirm('Clear all parked ideas?')) {
      setItems([]);
    }
  };

  return (
    <div className="parking-lot">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 shadow-lg"
          title="Parking Lot - Save ideas for later"
        >
          <Lightbulb className="h-6 w-6" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Button>
      )}

      {isOpen && (
        <Card className="w-80 max-h-96 overflow-hidden flex flex-col shadow-xl">
          <div className="p-4 border-b flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Parking Lot</h3>
            </div>
            <div className="flex gap-2">
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 flex gap-2">
            <Input
              placeholder="Quick idea to save for later..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addItem();
                }
              }}
            />
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {items.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">
                Save ideas here without losing focus on your current task
              </p>
            )}

            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-muted rounded-lg flex items-start gap-2 group"
              >
                <div className="flex-1">
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
