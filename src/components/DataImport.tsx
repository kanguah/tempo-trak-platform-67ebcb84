import { useState } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
interface DataImportProps {
  type: "students" | "tutors" | "leads" | "payments" | "expenses";
  onSuccess?: () => void;
}
interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  duplicates: number;
  duplicateDetails: string[];
}
const instruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Trumpet"];
export default function DataImport({
  type,
  onSuccess
}: DataImportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const downloadTemplate = () => {
    const headers = type === "students" 
      ? "name,email,phone,grade,instrument,date_of_birth,parent_name,parent_email,parent_phone,address\n" 
      : type === "tutors"
      ? "name,email,phone,instrument,status,hourly_rate\n"
      : type === "payments"
      ? "student_name,student_email,student_phone,amount,status,due_date,package_type,description,discount_amount\n"
      : type === "expenses"
      ? "category,amount,expense_date,payment_method,status,description\n"
      : "name,email,phone,source,notes,stage,created_date\n";
    const sampleData = type === "students" 
      ? "John Doe,john@email.com,+233 24 123 4567,Beginner,Piano,2010-05-15,Mary Doe,mary@email.com,+233 24 123 4560,123 Music St\nJane Smith,jane@email.com,+233 24 123 4568,Intermediate,Guitar,2012-08-22,,,,\n" 
      : type === "tutors"
      ? "Mr. Kofi,kofi@email.com,+233 24 123 4567,Piano,Active,50\nMs. Ama,ama@email.com,+233 24 123 4568,Guitar,Active,45\n"
      : type === "payments"
      ? "John Doe,john@email.com,+233 24 123 4567,250,pending,2025-12-31,2x per week,Monthly fee,0\nJane Smith,jane@email.com,+233 24 123 4568,500,completed,2025-11-30,4x per week,Monthly fee with discount,50\n"
      : type === "expenses"
      ? "Tutor Salaries,3000,2025-11-01,Bank Transfer,paid,Monthly salaries\nFacility Rent,1500,2025-11-05,Cash,paid,Monthly rent payment\n"
      : "Alice Thompson,alice.t@email.com,+233 24 777 8888,Website Form,Interested in beginner lessons,new,2025-01-15\nRobert Kim,robert.kim@email.com,+233 24 888 9999,Facebook Ad,Adult learner wants weekend classes,contacted,2025-01-10\n";
    const csv = headers + sampleData;
    const blob = new Blob([csv], {
      type: "text/csv"
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_import_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded successfully!");
  };
  const validateRow = (row: any, index: number): {
    valid: boolean;
    error?: string;
  } => {
    if (type === "payments") {
      if (!row.student_name) {
        return { valid: false, error: `Row ${index + 1}: Missing required field (student_name)` };
      }
      if (!row.student_email && !row.student_phone) {
        return { valid: false, error: `Row ${index + 1}: Missing student identifier - provide either student_email or student_phone` };
      }
      if (!row.amount || isNaN(parseFloat(row.amount))) {
        return { valid: false, error: `Row ${index + 1}: Invalid or missing amount` };
      }
      if (row.status && !["pending", "completed", "failed", "refunded"].includes(row.status)) {
        return { valid: false, error: `Row ${index + 1}: Invalid status. Must be pending, completed, failed, or refunded` };
      }
      return { valid: true };
    }

    if (type === "expenses") {
      if (!row.category) {
        return { valid: false, error: `Row ${index + 1}: Missing required field (category)` };
      }
      if (!row.amount || isNaN(parseFloat(row.amount))) {
        return { valid: false, error: `Row ${index + 1}: Invalid or missing amount` };
      }
      if (!row.expense_date) {
        return { valid: false, error: `Row ${index + 1}: Missing required field (expense_date)` };
      }
      if (row.status && !["pending", "paid", "approved"].includes(row.status)) {
        return { valid: false, error: `Row ${index + 1}: Invalid status. Must be pending, paid, or approved` };
      }
      return { valid: true };
    }

    if (type === "leads") {
      if (!row.name) {
        return {
          valid: false,
          error: `Row ${index + 1}: Missing required field (name)`
        };
      }
      if (row.email && !row.email.includes("@")) {
        return {
          valid: false,
          error: `Row ${index + 1}: Invalid email format`
        };
      }
      if (row.stage && !["new", "contacted", "qualified", "converted", "lost"].includes(row.stage)) {
        return {
          valid: false,
          error: `Row ${index + 1}: Invalid stage. Must be new, contacted, qualified, converted, or lost`
        };
      }
      return {
        valid: true
      };
    }

    if (!row.name) {
      return {
        valid: false,
        error: `Row ${index + 1}: Missing required field (name)`
      };
    }
    if (row.email && !row.email.includes("@")) {
      return {
        valid: false,
        error: `Row ${index + 1}: Invalid email format`
      };
    }

    if (!row.phone) {
      return {
        valid: false,
        error: `Row ${index + 1}: Missing phone number`
      };
    }

    if (!row.instrument || !instruments.includes(row.instrument)) {
      return {
        valid: false,
        error: `Row ${index + 1}: Invalid instrument. Must be one of: ${instruments.join(", ")}`
      };
    }
    if (type === "students") {
      if (!row.grade || !["Beginner", "Intermediate", "Advanced"].includes(row.grade)) {
        return {
          valid: false,
          error: `Row ${index + 1}: Invalid grade. Must be Beginner, Intermediate, or Advanced`
        };
      }
    }
    if (type === "tutors") {
      if (!row.status || !["Active", "On Leave"].includes(row.status)) {
        return {
          valid: false,
          error: `Row ${index + 1}: Invalid status. Must be Active or On Leave`
        };
      }
    }
    return {
      valid: true
    };
  };
  const processFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setImporting(true);
    setResult(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        const rows = results.data as any[];
        const errors: string[] = [];
        const validRows: any[] = [];

        // Validate all rows first
        rows.forEach((row, index) => {
          const validation = validateRow(row, index);
          if (!validation.valid) {
            errors.push(validation.error!);
          } else {
            validRows.push(row);
          }
        });
        if (validRows.length === 0) {
          setResult({
            success: 0,
            failed: rows.length,
            errors,
            duplicates: 0,
            duplicateDetails: []
          });
          setImporting(false);
          toast.error("No valid rows to import");
          return;
        }

        // Fetch existing records to check for duplicates
        const tableName = type === "leads" ? "crm_leads" : type;
        
        // Skip duplicate checking for payments and expenses
        if (type === "payments" || type === "expenses") {
          const dataToInsert = await prepareDataForInsertion(validRows);
          const { data, error } = await supabase.from(tableName).insert(dataToInsert).select();
          
          if (error) {
            console.error("Import error:", error);
            errors.push(`Database error: ${error.message}`);
            setResult({
              success: 0,
              failed: validRows.length,
              errors,
              duplicates: 0,
              duplicateDetails: []
            });
            toast.error("Failed to import data");
          } else {
            const successCount = data?.length || 0;
            setResult({
              success: successCount,
              failed: errors.length,
              errors,
              duplicates: 0,
              duplicateDetails: []
            });
            queryClient.invalidateQueries({ queryKey: [type] });
            toast.success(`Successfully imported ${successCount} ${type}`);
            if (onSuccess) onSuccess();
          }
          setImporting(false);
          return;
        }

        const { data: existingRecords, error: fetchError } = await supabase
          .from(tableName)
          .select("email, name, phone")
          .eq("user_id", user?.id);
        
        if (fetchError) {
          console.error("Error fetching existing records:", fetchError);
        }

        // Create sets of existing record identifiers: name+email and name+phone combinations
        const existingIdentifiers = new Set<string>();
        (existingRecords || []).forEach((r: any) => {
          const name = r.name?.trim().toLowerCase() || "";
          const email = r.email?.trim().toLowerCase() || "";
          const phone = r.phone?.trim() || "";
          
          if (name && email) {
            existingIdentifiers.add(`${name}|${email}`);
          }
          if (name && phone) {
            existingIdentifiers.add(`${name}|${phone}`);
          }
        });

        // Check for duplicates within CSV and against database
        const seenInCSV = new Set<string>();
        const rowsToInsert: any[] = [];
        const duplicateRows: any[] = [];
        const duplicateDetails: string[] = [];

        validRows.forEach((row, index) => {
          const email = row.email?.trim().toLowerCase() || "";
          const phone = row.phone?.trim() || "";
          const name = row.name?.trim().toLowerCase() || "";
          
          if (!name) {
            // Skip rows without name as we can't create a proper identifier
            rowsToInsert.push(row);
            return;
          }
          
          // Create identifiers: name+email and name+phone
          const identifierWithEmail = email ? `${name}|${email}` : null;
          const identifierWithPhone = phone ? `${name}|${phone}` : null;
          
          // Check for duplicate within CSV
          const isDuplicateInCSV = 
            (identifierWithEmail && seenInCSV.has(identifierWithEmail)) ||
            (identifierWithPhone && seenInCSV.has(identifierWithPhone));
          
          if (isDuplicateInCSV) {
            duplicateRows.push(row);
            const displayName = row.name?.trim() || 'Unknown';
            duplicateDetails.push(`Row ${index + 1}: Duplicate in CSV - ${displayName}${email ? ` (${email})` : ''}${phone ? ` (${phone})` : ''}`);
            return;
          }
          
          // Check for duplicate in database
          const isDuplicateInDB = 
            (identifierWithEmail && existingIdentifiers.has(identifierWithEmail)) ||
            (identifierWithPhone && existingIdentifiers.has(identifierWithPhone));
          
          if (isDuplicateInDB) {
            duplicateRows.push(row);
            const displayName = row.name?.trim() || 'Unknown';
            duplicateDetails.push(`Row ${index + 1}: Already exists in database - ${displayName}${email ? ` (${email})` : ''}${phone ? ` (${phone})` : ''}`);
            return;
          }
          
          // No duplicate, add to insert list and track identifiers
          if (identifierWithEmail) {
            seenInCSV.add(identifierWithEmail);
          }
          if (identifierWithPhone) {
            seenInCSV.add(identifierWithPhone);
          }
          rowsToInsert.push(row);
        });

        if (rowsToInsert.length === 0) {
          setResult({
            success: 0,
            failed: errors.length,
            errors,
            duplicates: duplicateRows.length,
            duplicateDetails
          });
          setImporting(false);
          toast.error("All rows are duplicates or invalid");
          return;
        }

        // Prepare data for insertion (only non-duplicates)
        const dataToInsert = await prepareDataForInsertion(rowsToInsert);

        // Bulk insert
        const {
          data,
          error
        } = await supabase.from(tableName).insert(dataToInsert).select();
        if (error) {
          console.error("Import error:", error);
          errors.push(`Database error: ${error.message}`);
          setResult({
            success: 0,
            failed: validRows.length,
            errors,
            duplicates: duplicateRows.length,
            duplicateDetails
          });
          toast.error("Failed to import data");
        } else {
          const successCount = data?.length || 0;
          setResult({
            success: successCount,
            failed: errors.length,
            errors,
            duplicates: duplicateRows.length,
            duplicateDetails
          });
          queryClient.invalidateQueries({
            queryKey: [type]
          });
          
          let message = `Successfully imported ${successCount} ${type}`;
          if (duplicateRows.length > 0) {
            message += ` (${duplicateRows.length} duplicate${duplicateRows.length > 1 ? 's' : ''} skipped)`;
          }
          toast.success(message);
          
          if (onSuccess) {
            onSuccess();
          }
        }
        setImporting(false);
      },
      error: error => {
        console.error("Parse error:", error);
        toast.error("Failed to parse CSV file");
        setImporting(false);
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
    // Reset file input
    event.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    processFile(file);
  };

  const prepareDataForInsertion = async (rows: any[]) => {
    if (type === "payments") {
      // Fetch all students to map by name + (email OR phone)
      const { data: students } = await supabase
        .from('students')
        .select('id, name, email, phone')
        .eq('user_id', user?.id);
      
      // Create a map with multiple identifiers per student
      const studentMap = new Map<string, string>();
      students?.forEach(s => {
        const name = s.name.toLowerCase().trim();
        const email = s.email?.toLowerCase().trim();
        const phone = s.phone?.trim();
        
        if (email) {
          studentMap.set(`${name}|${email}`, s.id);
        }
        if (phone) {
          studentMap.set(`${name}|${phone}`, s.id);
        }
      });
      
      return rows.map(row => {
        const name = row.student_name.trim().toLowerCase();
        const email = row.student_email?.trim().toLowerCase();
        const phone = row.student_phone?.trim();
        
        // Try to match by name + email first, then name + phone
        let studentId = null;
        if (email) {
          studentId = studentMap.get(`${name}|${email}`);
        }
        if (!studentId && phone) {
          studentId = studentMap.get(`${name}|${phone}`);
        }
        
        return {
          student_id: studentId || null,
          amount: parseFloat(row.amount),
          status: row.status?.trim() || 'pending',
          due_date: row.due_date?.trim() || null,
          package_type: row.package_type?.trim() || null,
          description: row.description?.trim() || null,
          discount_amount: row.discount_amount ? parseFloat(row.discount_amount) : 0,
          user_id: user?.id
        };
      });
    }

    if (type === "expenses") {
      return rows.map(row => ({
        category: row.category.trim(),
        amount: parseFloat(row.amount),
        expense_date: row.expense_date.trim(),
        payment_method: row.payment_method?.trim() || null,
        status: row.status?.trim() || 'pending',
        description: row.description?.trim() || null,
        user_id: user?.id,
        approved_by: row.status === 'paid' ? user?.id : null,
        paid_by: row.status === 'paid' ? user?.id : null
      }));
    }

    if (type === "leads") {
      return rows.map(row => {
        const leadData: any = {
          name: row.name.trim(),
          email: row.email?.trim().toLowerCase() || null,
          phone: row.phone?.trim() || null,
          source: row.source?.trim() || null,
          notes: row.notes?.trim() || null,
          stage: row.stage?.trim() || "new",
          user_id: user?.id
        };
        if (row.created_date?.trim()) {
          leadData.created_at = row.created_date.trim();
        }
        return leadData;
      });
    }

    const baseData = rows.map(row => ({
      name: row.name.trim(),
      email: row.email?.trim().toLowerCase() || null,
      phone: row.phone?.trim() || null,
      subjects: [row.instrument.trim()],
      user_id: user?.id
    }));

    if (type === "students") {
      return baseData.map((data, i) => ({
        ...data,
        grade: rows[i].grade.trim(),
        status: "active",
        date_of_birth: rows[i].date_of_birth?.trim() || null,
        parent_name: rows[i].parent_name?.trim() || null,
        parent_email: rows[i].parent_email?.trim() || null,
        parent_phone: rows[i].parent_phone?.trim() || null,
        address: rows[i].address?.trim() || null,
      }));
    } else {
      return baseData.map((data, i) => ({
        ...data,
        status: rows[i].status.trim().toLowerCase(),
        hourly_rate: rows[i].hourly_rate ? parseFloat(rows[i].hourly_rate) : null
      }));
    }
  };

  const handleExport = async () => {
    try {
      toast.loading("Exporting data...");
      
      const tableName = type === "leads" ? "crm_leads" : type;
      const selectQuery = type === "payments" 
        ? '*, students(name, email, phone)'
        : '*';
      
      const { data, error } = await supabase
        .from(tableName)
        .select(selectQuery)
        .eq('user_id', user?.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.dismiss();
        toast.error(`No ${type} to export`);
        return;
      }

      // Format data for CSV
      const formattedData: any[] = type === "students" 
        ? data.map((item: any) => ({
            name: item.name,
            email: item.email,
            phone: item.phone || '',
            grade: item.grade || '',
            instrument: item.subjects?.[0] || '',
            date_of_birth: item.date_of_birth || '',
            parent_name: item.parent_name || '',
            parent_email: item.parent_email || '',
            parent_phone: item.parent_phone || '',
            parent_address: item.address || '',
            enrollment_date: item.enrollment_date
          }))
        : type === "tutors"
        ? data.map((item: any) => ({
            name: item.name,
            email: item.email,
            phone: item.phone || '',
            instrument: item.subjects?.[0] || '',
            status: item.status,
            hourly_rate: item.hourly_rate || '',
            availability: item.availability || ''
          }))
        : type === "payments"
        ? data.map((item: any) => ({
            student_name: item.students?.name || '',
            student_email: item.students?.email || '',
            student_phone: item.students?.phone || '',
            amount: item.amount,
            status: item.status,
            due_date: item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '',
            package_type: item.package_type || '',
            description: item.description || '',
            discount_amount: item.discount_amount || 0,
            paid_amount: item.paid_amount || 0,
            payment_date: item.payment_date ? new Date(item.payment_date).toISOString().split('T')[0] : ''
          }))
        : type === "expenses"
        ? data.map((item: any) => ({
            category: item.category,
            amount: item.amount,
            expense_date: item.expense_date,
            payment_method: item.payment_method || '',
            status: item.status,
            description: item.description || ''
          }))
        : data.map((item: any) => ({
            name: item.name,
            email: item.email,
            phone: item.phone || '',
            source: item.source || '',
            notes: item.notes || '',
            stage: item.stage,
            created_date: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : ''
          }));

      const csv = Papa.unparse(formattedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(`${data.length} ${type} exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss();
      toast.error('Failed to export data');
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import CSV</span>
              <span className="sm:hidden">Import</span>
            </Button>
          </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Import {type === "students" ? "Students" : type === "tutors" ? "Tutors" : type === "leads" ? "Leads" : type === "payments" ? "Payments" : "Expenses"} from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Download the template below, fill it with your data, and upload the completed CSV file.
              {type === "students" ? <>
                  <br />Required: name, email, phone, grade (Beginner/Intermediate/Advanced), instrument
                  <br />Optional: date_of_birth, parent_name, parent_email, parent_phone, address (leave empty if not available)
                </> : type === "tutors" ? <>
                  <br />Required columns: name, email, phone, instrument, status (Active/On Leave), hourly_rate (optional)
                </> : type === "payments" ? <>
                  <br />Required: student_name, student_email OR student_phone (for accurate matching), amount, status (pending/completed/failed/refunded)
                  <br />Optional: due_date, package_type, description, discount_amount
                </> : type === "expenses" ? <>
                  <br />Required: category, amount, expense_date, payment_method, status (pending/paid/approved)
                  <br />Optional: description
                </> : <>
                  <br />Required: name
                  <br />Optional: email, phone, source, notes, stage (new/contacted/qualified/converted/lost), created_date (YYYY-MM-DD format)
                </>}
            </AlertDescription>
          </Alert>

          {/* Download Template */}
          <div className="space-y-2">
            <Label>Step 1: Download Template</Label>
            <Button variant="outline" className="w-full" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
          </div>

          {/* Upload File */}
          <div className="space-y-2">
            <Label htmlFor="csv-upload">Step 2: Upload Completed CSV</Label>
            <div className="flex items-center justify-center w-full">
              <label 
                htmlFor="csv-upload" 
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragging 
                    ? "bg-primary/10 border-primary" 
                    : "bg-muted/50 hover:bg-muted"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileSpreadsheet className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV files only</p>
                </div>
                <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={importing} />
              </label>
            </div>
          </div>

          {/* Import Status */}
          {importing && <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Importing data...</p>
            </div>}

          {/* Results */}
          {result && <div className="space-y-3">
              <div className={`grid gap-4 ${result.duplicates > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-muted-foreground mb-1">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{result.success}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-muted-foreground mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                </div>
                {result.duplicates > 0 && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Duplicates Skipped</p>
                    <p className="text-2xl font-bold text-yellow-600">{result.duplicates}</p>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && <div className="max-h-40 overflow-y-auto space-y-1">
                  <p className="text-sm font-medium text-destructive mb-2">Errors:</p>
                  {result.errors.map((error, index) => <p key={index} className="text-xs text-muted-foreground bg-destructive/10 p-2 rounded">
                      {error}
                    </p>)}
                </div>}

              {result.duplicateDetails.length > 0 && <div className="max-h-40 overflow-y-auto space-y-1">
                  <p className="text-sm font-medium text-yellow-600 mb-2">Duplicates:</p>
                  {result.duplicateDetails.map((detail, index) => <p key={index} className="text-xs text-muted-foreground bg-yellow-500/10 p-2 rounded">
                      {detail}
                    </p>)}
                </div>}

              <Button className="w-full" onClick={() => {
            setResult(null);
            setDialogOpen(false);
          }}>
                Done
              </Button>
            </div>}
        </div>
      </DialogContent>
        </Dialog>

        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>
    </>
  );
}