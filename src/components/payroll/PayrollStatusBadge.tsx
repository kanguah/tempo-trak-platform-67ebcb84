import { Badge } from "@/components/ui/badge";

interface PayrollStatusBadgeProps {
  status: string;
}

export function PayrollStatusBadge({ status }: PayrollStatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'approved':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant()} className="capitalize">
      {status}
    </Badge>
  );
}
