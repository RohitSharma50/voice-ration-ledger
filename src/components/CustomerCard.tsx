import { useNavigate } from "react-router-dom";
import { Phone, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteCustomer } from "@/hooks/useCustomers";
import { toast } from "sonner";

interface Props {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
}

export function CustomerCard({ id, name, phone, createdAt }: Props) {
  const navigate = useNavigate();
  const deleteCustomer = useDeleteCustomer();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete ${name} and all their entries?`)) return;
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success(`${name} removed`);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div
      onClick={() => navigate(`/customer/${id}`)}
      className="khata-card flex items-center gap-4 p-4 cursor-pointer animate-fade-in"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-display text-lg font-bold">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-card-foreground truncate">{name}</h3>
        {phone && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" /> {phone}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Added {new Date(createdAt).toLocaleDateString("en-IN")}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}
