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
  type: "students" | "tutors" | "leads";
  onSuccess?: () => void;
}
interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}
const instruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Flute", "Cello", "Trumpet", "Bass"];
export default function DataImport({
  type,
  onSuccess
}: DataImportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const downloadTemplate = () => {
    const headers = type === "students" 
      ? "name,email,phone,grade,instrument,date_of_birth,parent_name,parent_email,parent_phone,address\n" 
      : type === "tutors"
      ? "name,email,phone,instrument,status,hourly_rate\n"
      : "name,email,phone,source,notes,stage\n";
    const sampleData = type === "students" 
      ? "John Doe,john@email.com,+233 24 123 4567,Beginner,Piano,2010-05-15,Mary Doe,mary@email.com,+233 24 123 4560,123 Music St\nJane Smith,jane@email.com,+233 24 123 4568,Intermediate,Guitar,2012-08-22,,,,\n" 
      : type === "tutors"
      ? "Mr. Kofi,kofi@email.com,+233 24 123 4567,Piano,Active,50\nMs. Ama,ama@email.com,+233 24 123 4568,Guitar,Active,45\n"
      : "Alice Thompson,alice.t@email.com,+233 24 777 8888,Website Form,Interested in beginner lessons,new\nRobert Kim,robert.kim@email.com,+233 24 888 9999,Facebook Ad,Adult learner wants weekend classes,contacted\n";
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
    if (!row.name || !row.email) {
      return {
        valid: false,
        error: `Row ${index + 1}: Missing required fields (name, email)`
      };
    }
    if (!row.email.includes("@")) {
      return {
        valid: false,
        error: `Row ${index + 1}: Invalid email format`
      };
    }

    if (type === "leads") {
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
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
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
            errors
          });
          setImporting(false);
          toast.error("No valid rows to import");
          return;
        }

        // Prepare data for insertion
        const dataToInsert = validRows.map(row => {
          if (type === "leads") {
            return {
              name: row.name.trim(),
              email: row.email.trim().toLowerCase(),
              phone: row.phone?.trim() || null,
              source: row.source?.trim() || null,
              notes: row.notes?.trim() || null,
              stage: row.stage?.trim() || "new",
              user_id: user?.id
            };
          }

          const baseData = {
            name: row.name.trim(),
            email: row.email.trim().toLowerCase(),
            phone: row.phone.trim(),
            subjects: [row.instrument.trim()],
            user_id: user?.id
          };
          if (type === "students") {
            return {
              ...baseData,
              grade: row.grade.trim(),
              status: "active",
              date_of_birth: row.date_of_birth?.trim() || null,
              parent_name: row.parent_name?.trim() || null,
              parent_email: row.parent_email?.trim() || null,
              parent_phone: row.parent_phone?.trim() || null,
              address: row.address?.trim() || null,
            };
          } else {
            return {
              ...baseData,
              status: row.status.trim().toLowerCase(),
              hourly_rate: row.hourly_rate ? parseFloat(row.hourly_rate) : null
            };
          }
        });

        // Bulk insert
        const tableName = type === "leads" ? "crm_leads" : type;
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
            errors
          });
          toast.error("Failed to import data");
        } else {
          const successCount = data?.length || 0;
          setResult({
            success: successCount,
            failed: errors.length,
            errors
          });
          queryClient.invalidateQueries({
            queryKey: [type]
          });
          toast.success(`Successfully imported ${successCount} ${type}`);
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

    // Reset file input
    event.target.value = "";
  };

  const handleExport = async () => {
    try {
      toast.loading("Exporting data...");
      
      const tableName = type === "leads" ? "crm_leads" : type;
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
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
        : data.map((item: any) => ({
            name: item.name,
            email: item.email,
            phone: item.phone || '',
            source: item.source || '',
            notes: item.notes || '',
            stage: item.stage,
            created_at: item.created_at
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import {type === "students" ? "Students" : type === "tutors" ? "Tutors" : "Leads"} from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
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
                </> : <>
                  <br />Required: name, email
                  <br />Optional: phone, source, notes, stage (new/contacted/qualified/converted/lost)
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
              <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-muted-foreground mb-1">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{result.success}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-muted-foreground mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                </div>
              </div>

              {result.errors.length > 0 && <div className="max-h-40 overflow-y-auto space-y-1">
                  <p className="text-sm font-medium text-destructive mb-2">Errors:</p>
                  {result.errors.map((error, index) => <p key={index} className="text-xs text-muted-foreground bg-destructive/10 p-2 rounded">
                      {error}
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