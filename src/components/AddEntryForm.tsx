import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAddRationEntry } from "@/hooks/useRationEntries";
import { toast } from "sonner";

const UNITS = ["kg", "g", "litre", "ml", "piece", "packet"];

export function AddEntryForm({ customerId }: { customerId: string }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const addEntry = useAddRationEntry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !quantity || !price) return;
    try {
      await addEntry.mutateAsync({
        customer_id: customerId,
        item_name: itemName.trim(),
        quantity: parseFloat(quantity),
        unit,
        price: parseFloat(price),
      });
      toast.success("Entry added");
      setItemName("");
      setQuantity("");
      setPrice("");
    } catch {
      toast.error("Failed to add entry");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg bg-secondary/50 p-4">
      <div className="flex-1 min-w-[120px] space-y-1">
        <Label className="text-xs text-muted-foreground">Item</Label>
        <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Rice, Dal..." required />
      </div>
      <div className="w-20 space-y-1">
        <Label className="text-xs text-muted-foreground">Qty</Label>
        <Input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" required />
      </div>
      <div className="w-24 space-y-1">
        <Label className="text-xs text-muted-foreground">Unit</Label>
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {UNITS.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-24 space-y-1">
        <Label className="text-xs text-muted-foreground">Price (₹)</Label>
        <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" required />
      </div>
      <Button type="submit" size="icon" disabled={addEntry.isPending}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
