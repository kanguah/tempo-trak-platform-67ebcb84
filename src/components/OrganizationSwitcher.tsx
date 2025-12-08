import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function OrganizationSwitcher() {
  const { currentOrganization, organizations, switchOrganization, isLoading } = useOrganization();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto py-2"
        >
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentOrganization?.logo_url || undefined} />
              <AvatarFallback className="text-xs">
                {currentOrganization?.name?.charAt(0) || "O"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">
              {currentOrganization?.name || "Select Organization"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup heading="Your Organizations">
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => {
                    switchOrganization(org.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={org.logo_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {org.name?.charAt(0) || "O"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{org.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentOrganization?.id === org.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  navigate("/onboarding");
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
