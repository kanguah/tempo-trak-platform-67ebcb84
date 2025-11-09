import { useState } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
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
  type: "students" | "tutors";
  onSuccess?: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const instruments = ["Piano", "Guitar", "Violin", "Drums", "Voice", "Saxophone", "Flute", "Cello", "Trumpet", "Bass"];

export default function DataImport({ type, onSuccess }: DataImportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const downloadTemplate = () => {
    const headers = type === "students" 
      ? "name,email,phone,grade,instrument\n"
      : "name,email,phone,instrument,status,hourly_rate\n";
    
    const sampleData = type === "students"
      ? "John Doe,john@email.com,+233 24 123 4567,Beginner,Piano\nJane Smith,jane@email.com,+233 24 123 4568,Intermediate,Guitar\n"
      : "Mr. Kofi,kofi@email.com,+233 24 123 4567,Piano,Active,50\nMs. Ama,ama@email.com,+233 24 123 4568,Guitar,Active,45\n";

    const csv = headers + sampleData;
    const blob = new Blob([csv], { type: "text/csv" });
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

  const validateRow = (row: any, index: number): { valid: boolean; error?: string } => {
    if (!row.name || !row.email || !row.phone) {
      return { valid: false, error: `Row ${index + 1}: Missing required fields (name, email, phone)` };
    }

    if (!row.email.includes("@")) {
      return { valid: false, error: `Row ${index + 1}: Invalid email format` };
    }

    if (!row.instrument || !instruments.includes(row.instrument)) {
      return { valid: false, error: `Row ${index + 1}: Invalid instrument. Must be one of: ${instruments.join(", ")}` };
    }

    if (type === "students") {
      if (!row.grade || !["Beginner", "Intermediate", "Advanced"].includes(row.grade)) {
        return { valid: false, error: `Row ${index + 1}: Invalid grade. Must be Beginner, Intermediate, or Advanced` };
      }
    }

    if (type === "tutors") {
      if (!row.status || !["Active", "On Leave"].includes(row.status)) {
        return { valid: false, error: `Row ${index + 1}: Invalid status. Must be Active or On Leave` };
      }
    }

    return { valid: true };
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
      complete: async (results) => {
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
          setResult({ success: 0, failed: rows.length, errors });
          setImporting(false);
          toast.error("No valid rows to import");
          return;
        }

        // Prepare data for insertion
        const dataToInsert = validRows.map(row => {
          const baseData = {
            name: row.name.trim(),
            email: row.email.trim().toLowerCase(),
            phone: row.phone.trim(),
            subjects: [row.instrument.trim()],
            user_id: user?.id,
          };

          if (type === "students") {
            return {
              ...baseData,
              grade: row.grade.trim(),
              status: "active",
            };
          } else {
            return {
              ...baseData,
              status: row.status.trim().toLowerCase(),
              hourly_rate: row.hourly_rate ? parseFloat(row.hourly_rate) : null,
            };
          }
        });

        // Bulk insert
        const { data, error } = await supabase
          .from(type)
          .insert(dataToInsert)
          .select();

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
          
          queryClient.invalidateQueries({ queryKey: [type] });
          
          toast.success(`Successfully imported ${successCount} ${type}`);
          
          if (onSuccess) {
            onSuccess();
          }
        }

        setImporting(false);
      },
      error: (error) => {
        console.error("Parse error:", error);
        toast.error("Failed to parse CSV file");
        setImporting(false);
      },
    });

    // Reset file input
    event.target.value = "";
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-sm">
          <Upload className="mr-2 h-5 w-5" />
          Import from CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import {type === "students" ? "Students" : "Tutors"} from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Download the template below, fill it with your data, and upload the completed CSV file.
              {type === "students" ? (
                <>
                  <br />Required columns: name, email, phone, grade (Beginner/Intermediate/Advanced), instrument
                </>
              ) : (
                <>
                  <br />Required columns: name, email, phone, instrument, status (Active/On Leave), hourly_rate (optional)
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Download Template */}
          <div className="space-y-2">
            <Label>Step 1: Download Template</Label>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={downloadTemplate}
            >
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
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileSpreadsheet className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV files only</p>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
              </label>
            </div>
          </div>

          {/* Import Status */}
          {importing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Importing data...</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
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

              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  <p className="text-sm font-medium text-destructive mb-2">Errors:</p>
                  {result.errors.map((error, index) => (
                    <p key={index} className="text-xs text-muted-foreground bg-destructive/10 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              )}

              <Button 
                className="w-full"
                onClick={() => {
                  setResult(null);
                  setDialogOpen(false);
                }}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}