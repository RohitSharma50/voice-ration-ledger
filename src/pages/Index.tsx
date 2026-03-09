import { useState } from "react";
import { Search, BookOpen, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/useCustomers";
import { CustomerCard } from "@/components/CustomerCard";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { GlobalVoiceEntry } from "@/components/GlobalVoiceEntry";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { data: customers, isLoading } = useCustomers();
  const { logout, phone } = useAuth();
  const [search, setSearch] = useState("");

  const filtered = customers?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="khata-header px-4 py-8 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              <h1 className="text-3xl font-bold font-display">Digital Khata</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-primary-foreground hover:bg-primary-foreground/20">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-primary-foreground/80 font-body text-sm">
            Logged in as {phone}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-4 space-y-4 pb-8">
        {/* Search + Add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <AddCustomerDialog />
        </div>

        {/* Global Voice Entry */}
        <GlobalVoiceEntry />

        {/* Customer List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-body">
              {search ? "No customers found" : "No customers yet. Add your first!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered?.map((c) => (
              <CustomerCard
                key={c.id}
                id={c.id}
                name={c.name}
                phone={c.phone}
                createdAt={c.created_at}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
