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

// Parse spoken text to extract quantity, unit, and item name
// e.g. "2 kg rice" → { quantity: "2", unit: "kg", itemName: "rice" }
// e.g. "5 piece bread" → { quantity: "5", unit: "piece", itemName: "bread" }
function parseSpokenItem(text: string): { itemName: string; quantity?: string; unit?: string } {
  const normalized = text.trim().toLowerCase();
  
  // Hindi number words mapping
  const hindiNumbers: Record<string, number> = {
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5,
    "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
    "ग्यारह": 11, "बारह": 12, "पंद्रह": 15, "बीस": 20,
    "पच्चीस": 25, "तीस": 30, "पचास": 50, "सौ": 100,
  };

  // Unit aliases (Hindi + English)
  const unitAliases: Record<string, string> = {
    "किलो": "kg", "किलोग्राम": "kg", "kg": "kg", "kilo": "kg",
    "ग्राम": "g", "gram": "g", "grams": "g", "g": "g",
    "लीटर": "litre", "litre": "litre", "liter": "litre", "l": "litre",
    "मिलीलीटर": "ml", "ml": "ml",
    "पीस": "piece", "piece": "piece", "pieces": "piece", "नग": "piece",
    "पैकेट": "packet", "packet": "packet", "packets": "packet",
  };

  const words = normalized.split(/\s+/);
  let quantity: string | undefined;
  let unit: string | undefined;
  const remainingWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check if it's a number
    const num = parseFloat(word);
    if (!isNaN(num) && !quantity) {
      quantity = String(num);
      continue;
    }
    
    // Check Hindi number words
    if (hindiNumbers[word] && !quantity) {
      quantity = String(hindiNumbers[word]);
      continue;
    }

    // Check unit aliases
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
  };
}

function parsePriceFromSpeech(text: string): string {
  const normalized = text.trim().toLowerCase();
  
  const hindiNumbers: Record<string, number> = {
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5,
    "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
    "ग्यारह": 11, "बारह": 12, "पंद्रह": 15, "बीस": 20,
    "पच्चीस": 25, "तीस": 30, "चालीस": 40, "पचास": 50,
    "साठ": 60, "सत्तर": 70, "अस्सी": 80, "नब्बे": 90, "सौ": 100,
    "दो सौ": 200, "तीन सौ": 300, "पांच सौ": 500, "हजार": 1000,
  };

  // Try to find a number first
  const numMatch = normalized.match(/[\d.]+/);
  if (numMatch) return numMatch[0];

  // Try Hindi number words
  for (const [word, num] of Object.entries(hindiNumbers)) {
    if (normalized.includes(word)) return String(num);
  }

  return text.trim();
}

export function AddEntryForm({ customerId }: { customerId: string }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const addEntry = useAddRationEntry();

  const onItemVoiceResult = useCallback((text: string) => {
    const parsed = parseSpokenItem(text);
    setItemName(parsed.itemName);
    if (parsed.quantity) setQuantity(parsed.quantity);
    if (parsed.unit) setUnit(parsed.unit);
  }, []);

  const onPriceVoiceResult = useCallback((text: string) => {
    setPrice(parsePriceFromSpeech(text));
  }, []);

  const itemVoice = useVoiceInput({ onResult: onItemVoiceResult });
  const priceVoice = useVoiceInput({ onResult: onPriceVoiceResult });

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
      {/* Item Name + Voice */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Item (speak: "2 kg rice")</Label>
        <div className="flex gap-2">
          <Input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Rice, Dal, Sugar..."
            className="flex-1"
            required
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={itemVoice.isListening ? "voice-pulse border-primary" : ""}
            onClick={itemVoice.isListening ? itemVoice.stopListening : itemVoice.startListening}
          >
            {itemVoice.isListening ? <MicOff className="h-4 w-4 text-primary" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
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

        {/* Price + Voice */}
        <div className="flex-1 min-w-[130px] space-y-1">
          <Label className="text-xs text-muted-foreground">Price (₹)</Label>
          <div className="flex gap-2">
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" required />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={priceVoice.isListening ? "voice-pulse border-primary" : ""}
              onClick={priceVoice.isListening ? priceVoice.stopListening : priceVoice.startListening}
            >
              {priceVoice.isListening ? <MicOff className="h-4 w-4 text-primary" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button type="submit" size="icon" disabled={addEntry.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
