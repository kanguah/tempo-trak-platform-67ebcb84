import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface GeneratePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  type: 'tutor' | 'staff';
}

export function GeneratePayrollDialog({ open, onOpenChange, month, type }: GeneratePayrollDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bonusPerLesson, setBonusPerLesson] = useState(50);
  const [bonusPerStudent, setBonusPerStudent] = useState(100);

  const generatePayroll = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      if (type === 'tutor') {
        // Fetch all active tutors
        const { data: tutors, error: tutorsError } = await supabase
          .from('tutors')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (tutorsError) throw tutorsError;

        // Generate payroll for each tutor
        for (const tutor of tutors || []) {
          // Count completed lessons for the month
          const { count: lessonsCount } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('tutor_id', tutor.id)
            .eq('status', 'completed')
            .ilike('lesson_date', `${month}%`);

          // Count active students (unique students from lessons)
          const { data: lessons } = await supabase
            .from('lessons')
            .select('student_id')
            .eq('tutor_id', tutor.id)
            .not('student_id', 'is', null);

          const uniqueStudents = new Set(lessons?.map(l => l.student_id)).size;

          const lessonBonus = (lessonsCount || 0) * bonusPerLesson;
          const studentBonus = uniqueStudents * bonusPerStudent;
          const totalAmount = (tutor.monthly_salary || 0) + lessonBonus + studentBonus;

          // Check if payroll already exists
          const { data: existing } = await supabase
            .from('tutor_payroll')
            .select('id')
            .eq('tutor_id', tutor.id)
            .eq('month', month)
            .single();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('tutor_payroll')
              .insert({
                user_id: user.id,
                tutor_id: tutor.id,
                month,
                base_salary: tutor.monthly_salary || 0,
                lessons_taught: lessonsCount || 0,
                active_students: uniqueStudents,
                lesson_bonus: lessonBonus,
                student_bonus: studentBonus,
                total_amount: totalAmount,
                status: 'pending'
              });

            if (insertError) throw insertError;
          }
        }
      } else {
        // Generate staff payroll
        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (staffError) throw staffError;

        for (const member of staff || []) {
          const { data: existing } = await supabase
            .from('staff_payroll')
            .select('id')
            .eq('staff_id', member.id)
            .eq('month', month)
            .single();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('staff_payroll')
              .insert({
                user_id: user.id,
                staff_id: member.id,
                month,
                base_salary: member.monthly_salary || 0,
                bonuses: 0,
                deductions: 0,
                total_amount: member.monthly_salary || 0,
                status: 'pending'
              });

            if (insertError) throw insertError;
          }
        }
      }
    },
    onSuccess: () => {
      toast.success(`${type === 'tutor' ? 'Tutor' : 'Staff'} payroll generated successfully`);
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to generate payroll: ${error.message}`);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate {type === 'tutor' ? 'Tutor' : 'Staff'} Payroll</DialogTitle>
          <DialogDescription>
            Generate payroll for {month}. This will create payroll records for all active {type}s.
          </DialogDescription>
        </DialogHeader>
        
        {type === 'tutor' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bonusPerLesson">Bonus per Lesson (GHS)</Label>
              <Input
                id="bonusPerLesson"
                type="number"
                value={bonusPerLesson}
                onChange={(e) => setBonusPerLesson(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="bonusPerStudent">Bonus per Active Student (GHS)</Label>
              <Input
                id="bonusPerStudent"
                type="number"
                value={bonusPerStudent}
                onChange={(e) => setBonusPerStudent(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => generatePayroll.mutate()} disabled={generatePayroll.isPending}>
            {generatePayroll.isPending ? 'Generating...' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
