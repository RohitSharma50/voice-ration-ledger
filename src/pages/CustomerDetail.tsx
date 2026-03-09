import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/useCustomers";
import { useRationEntries, useDeleteRationEntry } from "@/hooks/useRationEntries";
import { AddEntryForm } from "@/components/AddEntryForm";
import { toast } from "sonner";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customers } = useCustomers();
  const { data: entries, isLoading } = useRationEntries(id!);
  const deleteEntry = useDeleteRationEntry(id!);

  const customer = customers?.find((c) => c.id === id);
  const total = entries?.reduce((sum, e) => sum + Number(e.price), 0) ?? 0;

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteEntry.mutateAsync(entryId);
      toast.success("Entry removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (!customer && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="khata-header px-4 py-6 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 -ml-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/20 font-display text-2xl font-bold">
              {customer?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">{customer?.name}</h1>
              {customer?.phone && <p className="text-primary-foreground/70 text-sm">{customer.phone}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-4 space-y-4 pb-8">
        {/* Total */}
        <div className="khata-card p-4 flex items-center justify-between">
          <span className="text-muted-foreground font-body">Total Pending</span>
          <span className="text-2xl font-display font-bold text-foreground">₹{total.toFixed(2)}</span>
        </div>

        {/* Add Entry */}
        <AddEntryForm customerId={id!} />

        {/* Entries */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : entries?.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No entries yet</p>
        ) : (
          <div className="space-y-2">
            {entries?.map((entry) => (
              <div
                key={entry.id}
                className="khata-card flex items-center gap-3 p-3 animate-fade-in"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-card-foreground truncate">
                    {entry.item_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.quantity} {entry.unit} • {new Date(entry.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className="font-display font-semibold text-foreground">₹{Number(entry.price).toFixed(2)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteEntry(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
