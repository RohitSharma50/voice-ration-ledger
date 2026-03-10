import { useState, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useCustomers, useAddCustomer } from "@/hooks/useCustomers";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UNITS = ["kg", "g", "litre", "ml", "piece", "packet"];

const unitAliases: Record<string, string> = {
  "किलो": "kg", "किलोग्राम": "kg", "kg": "kg", "kilo": "kg",
  "ग्राम": "g", "gram": "g", "grams": "g", "g": "g",
  "लीटर": "litre", "litre": "litre", "liter": "litre", "l": "litre",
  "मिलीलीटर": "ml", "ml": "ml",
  "पीस": "piece", "piece": "piece", "pieces": "piece", "नग": "piece",
  "पैकेट": "packet", "packet": "packet", "packets": "packet",
};

const hindiNumbers: Record<string, number> = {
  "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5,
  "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
  "ग्यारह": 11, "बारह": 12, "पंद्रह": 15, "बीस": 20,
  "पच्चीस": 25, "तीस": 30, "चालीस": 40, "पचास": 50,
  "साठ": 60, "सत्तर": 70, "अस्सी": 80, "नब्बे": 90,
  "सौ": 100, "दो सौ": 200, "तीन सौ": 300, "पांच सौ": 500, "हजार": 1000,
};

const priceMarkers = ["rupees", "rupee", "rs", "रुपये", "रुपया", "रुपए", "रूपए", "रूपये", "rupaiye", "rupaye", "₹"];

function normalizeText(text: string) {
  return text.trim().toLowerCase().replace(/[०-९]/g, (d) =>
    String("०१२३४५६७८९".indexOf(d))
  );
}

function extractPrice(normalized: string): { price?: string; remaining: string } {
  let price: string | undefined;
  let remaining = normalized;

  for (const marker of priceMarkers) {
    const beforeRegex = new RegExp(`(\\d+\\.?\\d*)\\s*${marker}`, "i");
    const m = remaining.match(beforeRegex);
    if (m) { price = m[1]; remaining = remaining.replace(m[0], " ").trim(); break; }

    const afterRegex = new RegExp(`${marker}\\s*(\\d+\\.?\\d*)`, "i");
    const m2 = remaining.match(afterRegex);
    if (m2) { price = m2[1]; remaining = remaining.replace(m2[0], " ").trim(); break; }
  }

  // Hindi number words for price
  if (!price) {
    for (const marker of priceMarkers) {
      if (remaining.includes(marker)) {
        const sorted = Object.entries(hindiNumbers).sort((a, b) => b[0].length - a[0].length);
        for (const [word, num] of sorted) {
          if (remaining.includes(word)) {
            price = String(num);
            remaining = remaining.replace(marker, " ").replace(word, " ").trim();
            break;
          }
        }
        if (price) break;
      }
    }
  }

  return { price, remaining };
}

// Find best matching customer name from the beginning of the text
function findCustomerInText(text: string, customerNames: string[]): { customerName: string; remaining: string } | null {
  const lower = text.toLowerCase();
  // Sort by name length desc to match longer names first
  const sorted = [...customerNames].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    const nameLower = name.toLowerCase();
    if (lower.startsWith(nameLower)) {
      return { customerName: name, remaining: text.slice(name.length).trim() };
    }
    const idx = lower.indexOf(nameLower);
    if (idx !== -1) {
      return { customerName: name, remaining: (text.slice(0, idx) + " " + text.slice(idx + name.length)).trim() };
    }
  }
  return null;
}

// Extract a new customer name from the start of text (first 1-3 words that aren't numbers/units/price markers)
function extractNewCustomerName(text: string): { customerName: string; remaining: string } | null {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const nameWords: string[] = [];

  for (const word of words) {
    // Stop if we hit a number, unit, price marker, or Hindi number
    if (!isNaN(parseFloat(word))) break;
    if (unitAliases[word]) break;
    if (hindiNumbers[word]) break;
    if (priceMarkers.includes(word)) break;
    nameWords.push(word);
    if (nameWords.length >= 3) break; // Max 3 words for a name
  }

  if (nameWords.length === 0) return null;

  const customerName = nameWords.join(" ");
  const remaining = text.slice(customerName.length).trim();
  return { customerName, remaining };
}

function parseGlobalEntry(text: string, customerNames: string[]): {
  customerName?: string;
  itemName?: string;
  quantity?: string;
  unit?: string;
  price?: string;
} {
  let normalized = normalizeText(text);

  // 1. Extract price first
  const { price, remaining: afterPrice } = extractPrice(normalized);
  normalized = afterPrice;

  // 2. Find customer name
  const customerMatch = findCustomerInText(normalized, customerNames);
  let customerName: string | undefined;
  if (customerMatch) {
    customerName = customerMatch.customerName;
    normalized = customerMatch.remaining;
  }

  // 3. Parse quantity, unit, item from remaining
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  let quantity: string | undefined;
  let unit: string | undefined;
  const itemWords: string[] = [];

  for (const word of words) {
    const num = parseFloat(word);
    if (!isNaN(num) && !quantity) { quantity = String(num); continue; }
    if (hindiNumbers[word] && !quantity) { quantity = String(hindiNumbers[word]); continue; }
    if (unitAliases[word] && !unit) { unit = unitAliases[word]; continue; }
    itemWords.push(word);
  }

  return {
    customerName,
    itemName: itemWords.join(" ") || undefined,
    quantity,
    unit,
    price,
  };
}

export function GlobalVoiceEntry() {
  const { data: customers } = useCustomers();
  const addCustomer = useAddCustomer();
  const qc = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const onVoiceResult = useCallback(async (text: string) => {
    if (!customers) return;
    setIsProcessing(true);

    try {
      const customerNames = customers.map(c => c.name);
      const parsed = parseGlobalEntry(text, customerNames);

      if (!parsed.customerName) {
        toast.error("Customer name not recognized. Say: 'Ram Kumar 2 kg rice 60 rupees'");
        return;
      }
      if (!parsed.itemName) {
        toast.error("Item name not detected.");
        return;
      }

      // Find or create customer
      let customer = customers.find(c =>
        c.name.toLowerCase() === parsed.customerName!.toLowerCase()
      );

      if (!customer) {
        customer = await addCustomer.mutateAsync({ name: parsed.customerName! });
        toast.info(`New customer '${parsed.customerName}' created`);
      }

      // Add entry
      const { error } = await supabase.from("ration_entries").insert({
        customer_id: customer.id,
        item_name: parsed.itemName,
        quantity: parsed.quantity ? parseFloat(parsed.quantity) : 1,
        unit: parsed.unit ?? "kg",
        price: parsed.price ? parseFloat(parsed.price) : 0,
      });

      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["ration_entries", customer.id] });

      toast.success(
        `Added: ${parsed.customerName} — ${parsed.itemName} ${parsed.quantity ?? ""} ${parsed.unit ?? ""} ₹${parsed.price ?? "0"}`
      );
    } catch {
      toast.error("Failed to add entry");
    } finally {
      setIsProcessing(false);
    }
  }, [customers, addCustomer, qc]);

  const voice = useVoiceInput({ onResult: onVoiceResult });

  const handleClick = () => {
    if (voice.isListening) voice.stopListening();
    else voice.startListening();
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isProcessing}
      variant={voice.isListening ? "default" : "outline"}
      className={`gap-2 w-full ${voice.isListening ? "voice-pulse" : ""}`}
    >
      {voice.isListening
        ? <><MicOff className="h-4 w-4" /> Listening... say "Ram Kumar 2 kg rice 60 rupees"</>
        : <><Mic className="h-4 w-4" /> Quick Voice Entry</>
      }
    </Button>
  );
}
