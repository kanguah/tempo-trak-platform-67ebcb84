import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PayrollRecord {
  id: string;
  base_salary: number;
  bonuses?: number;
  deductions?: number;
  lesson_bonus?: number;
  student_bonus?: number;
  total_amount: number;
  notes?: string;
  lessons_taught?: number;
  active_students?: number;
}

interface EditPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: PayrollRecord | null;
  type: 'tutor' | 'staff';
}

export function EditPayrollDialog({ open, onOpenChange, record, type }: EditPayrollDialogProps) {
  const queryClient = useQueryClient();
  const [bonuses, setBonuses] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (record) {
      if (type === 'tutor') {
        setBonuses((record.lesson_bonus || 0) + (record.student_bonus || 0));
      } else {
        setBonuses(record.bonuses || 0);
      }
      setDeductions(record.deductions || 0);
      setNotes(record.notes || '');
    }
  }, [record, type]);

  const updatePayroll = useMutation({
    mutationFn: async () => {
      if (!record) return;

      const totalAmount = (record.base_salary || 0) + bonuses - deductions;
      const table = type === 'tutor' ? 'tutor_payroll' : 'staff_payroll';

      const updateData: any = {
        total_amount: totalAmount,
        deductions,
        notes
      };

      if (type === 'tutor') {
        updateData.lesson_bonus = bonuses;
        updateData.student_bonus = 0;
      } else {
        updateData.bonuses = bonuses;
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', record.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payroll updated successfully');
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update payroll: ${error.message}`);
    }
  });

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Payroll</DialogTitle>
          <DialogDescription>
            Adjust bonuses, deductions, and notes for this payroll record.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Base Salary</Label>
            <Input value={`GHS ${record.base_salary}`} disabled />
          </div>

          {type === 'tutor' && (
            <>
              <div>
                <Label>Lessons Taught</Label>
                <Input value={record.lessons_taught || 0} disabled />
              </div>
              <div>
                <Label>Active Students</Label>
                <Input value={record.active_students || 0} disabled />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="bonuses">Total Bonuses (GHS)</Label>
            <Input
              id="bonuses"
              type="number"
              value={bonuses}
              onChange={(e) => setBonuses(Number(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="deductions">Deductions (GHS)</Label>
            <Input
              id="deductions"
              type="number"
              value={deductions}
              onChange={(e) => setDeductions(Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Total Amount</Label>
            <Input value={`GHS ${(record.base_salary || 0) + bonuses - deductions}`} disabled />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this payroll record..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => updatePayroll.mutate()} disabled={updatePayroll.isPending}>
            {updatePayroll.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
