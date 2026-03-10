import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Mic, MicOff } from "lucide-react";
import { useAddRationEntry } from "@/hooks/useRationEntries";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "sonner";

const UNITS = ["kg", "g", "litre", "ml", "piece", "packet"];

// Parse spoken text to extract quantity, unit, item name, and price
// e.g. "2 kg rice 50 rupees" → { quantity: "2", unit: "kg", itemName: "rice", price: "50" }
function parseSpokenEntry(text: string): { itemName: string; quantity?: string; unit?: string; price?: string } {
  let normalized = text.trim().toLowerCase();

  // Convert Devanagari digits to Arabic
  normalized = normalized.replace(/[०-९]/g, (d) =>
    String("०१२३४५६७८९".indexOf(d))
  );

  const hindiNumbers: Record<string, number> = {
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5,
    "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
    "ग्यारह": 11, "बारह": 12, "पंद्रह": 15, "बीस": 20,
    "पच्चीस": 25, "तीस": 30, "चालीस": 40, "पचास": 50,
    "साठ": 60, "सत्तर": 70, "अस्सी": 80, "नब्बे": 90,
    "सौ": 100, "डेढ़ सौ": 150, "दो सौ": 200, "ढाई सौ": 250,
    "तीन सौ": 300, "पांच सौ": 500, "हजार": 1000,
  };

  const unitAliases: Record<string, string> = {
    // kg
    "किलो": "kg", "किलोग्राम": "kg", "kg": "kg", "kilo": "kg", "kilos": "kg", "kilogram": "kg", "kilograms": "kg",
    // g
    "ग्राम": "g", "gram": "g", "grams": "g", "g": "g",
    // litre
    "लीटर": "litre", "litre": "litre", "liter": "litre", "litres": "litre", "liters": "litre", "l": "litre",
    // ml
    "मिलीलीटर": "ml", "ml": "ml", "millilitre": "ml", "milliliter": "ml",
    // piece
    "पीस": "piece", "piece": "piece", "pieces": "piece", "pcs": "piece", "नग": "piece", "pc": "piece",
    // packet
    "पैकेट": "packet", "packet": "packet", "packets": "packet", "pack": "packet", "packs": "packet",
  };

  const priceMarkers = ["rupees", "rupee", "rs", "रुपये", "रुपया", "रुपए", "रूपए", "रूपये", "rupaiye", "rupaye", "₹"];

  // Extract price: look for number followed/preceded by price marker
  let price: string | undefined;
  
  // Pattern: "50 rupees" or "rupees 50" or "₹50"
  for (const marker of priceMarkers) {
    // number before marker: "50 rupees"
    const beforeRegex = new RegExp(`(\\d+\\.?\\d*)\\s*${marker}`, "i");
    const beforeMatch = normalized.match(beforeRegex);
    if (beforeMatch) {
      price = beforeMatch[1];
      normalized = normalized.replace(beforeMatch[0], " ").trim();
      break;
    }
    // marker before number: "rupees 50"  
    const afterRegex = new RegExp(`${marker}\\s*(\\d+\\.?\\d*)`, "i");
    const afterMatch = normalized.match(afterRegex);
    if (afterMatch) {
      price = afterMatch[1];
      normalized = normalized.replace(afterMatch[0], " ").trim();
      break;
    }
  }

  // Try Hindi number words for price if marker found without digit
  if (!price) {
    for (const marker of priceMarkers) {
      if (normalized.includes(marker)) {
        const sortedEntries = Object.entries(hindiNumbers).sort((a, b) => b[0].length - a[0].length);
        for (const [word, num] of sortedEntries) {
          if (normalized.includes(word)) {
            price = String(num);
            normalized = normalized.replace(marker, " ").replace(word, " ").trim();
            break;
          }
        }
        if (price) break;
      }
    }
  }

  // Now parse remaining for quantity, unit, item name
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  let quantity: string | undefined;
  let unit: string | undefined;
  const remainingWords: string[] = [];

  for (const word of words) {
    const num = parseFloat(word);
    if (!isNaN(num) && !quantity) {
      quantity = String(num);
      continue;
    }
    if (hindiNumbers[word] && !quantity) {
      quantity = String(hindiNumbers[word]);
      continue;
    }
    if (unitAliases[word] && !unit) {
      unit = unitAliases[word];
      continue;
    }
    remainingWords.push(word);
  }

  return {
    itemName: remainingWords.join(" ") || text.trim(),
    quantity,
    unit,
    price,
  };
}

export function AddEntryForm({ customerId }: { customerId: string }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const addEntry = useAddRationEntry();

  const submitEntry = useCallback(async (item: string, qty: string, u: string, p: string) => {
    if (!item.trim() || !qty || !p) return;
    try {
      await addEntry.mutateAsync({
        customer_id: customerId,
        item_name: item.trim(),
        quantity: parseFloat(qty),
        unit: u,
        price: parseFloat(p),
      });
      toast.success(`Added: ${item} ${qty} ${u} ₹${p}`);
      setItemName("");
      setQuantity("");
      setPrice("");
    } catch {
      toast.error("Failed to add entry");
    }
  }, [addEntry, customerId]);

  const onVoiceResult = useCallback((text: string) => {
    const parsed = parseSpokenEntry(text);
    const pItem = parsed.itemName;
    const pQty = parsed.quantity || "1";
    const pUnit = parsed.unit || "kg";
    const pPrice = parsed.price || "";

    // If we have item and price, auto-submit
    if (pItem && pPrice) {
      submitEntry(pItem, pQty, pUnit, pPrice);
    } else {
      // Fill form for manual completion
      setItemName(pItem);
      setQuantity(pQty);
      if (parsed.unit) setUnit(parsed.unit);
      if (parsed.price) setPrice(parsed.price);
      toast.info(`Fill missing fields and tap +`);
    }
  }, [submitEntry]);

  const voice = useVoiceInput({ onResult: onVoiceResult });

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
    <form onSubmit={handleSubmit} className="rounded-lg bg-secondary/50 p-4 space-y-3">
      {/* Voice input for all fields */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className={`gap-2 flex-1 ${voice.isListening ? "voice-pulse border-primary" : ""}`}
          onClick={voice.isListening ? voice.stopListening : voice.startListening}
        >
          {voice.isListening ? <MicOff className="h-4 w-4 text-primary" /> : <Mic className="h-4 w-4" />}
          {voice.isListening ? "Listening... (e.g. 2 kg rice 50 rupees)" : "Speak item, qty & price"}
        </Button>
      </div>

      {/* Item Name */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Item Name</Label>
        <Input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Rice, Dal, Sugar..."
          required
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {/* Quantity */}
        <div className="w-20 space-y-1">
          <Label className="text-xs text-muted-foreground">Qty</Label>
          <Input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" required />
        </div>

        {/* Unit */}
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

        {/* Price */}
        <div className="flex-1 min-w-[130px] space-y-1">
          <Label className="text-xs text-muted-foreground">Price (₹)</Label>
          <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" required />
        </div>

        <Button type="submit" size="icon" disabled={addEntry.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}