import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mic, MicOff } from "lucide-react";
import { useAddCustomer } from "@/hooks/useCustomers";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "sonner";

export function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const addCustomer = useAddCustomer();

  const onVoiceResult = useCallback((text: string) => {
    setName(text);
  }, []);

  const { isListening, startListening, stopListening } = useVoiceInput({
    onResult: onVoiceResult,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addCustomer.mutateAsync({ name: name.trim(), phone: phone.trim() || undefined });
      toast.success(`${name} added to khata`);
      setName("");
      setPhone("");
      setOpen(false);
    } catch {
      toast.error("Failed to add customer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer name"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={isListening ? "voice-pulse border-primary" : ""}
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? <MicOff className="h-4 w-4 text-primary" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
          </div>
          <Button type="submit" className="w-full" disabled={addCustomer.isPending}>
            {addCustomer.isPending ? "Adding..." : "Add to Khata"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
