import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    // Fetch payment details with student info
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*, students(name, email, phone, parent_name, parent_email, parent_phone)")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "completed") {
      throw new Error("Receipt can only be generated for completed payments");
    }

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(16, 185, 129); // Green color
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, "bold");
    doc.text("PAYMENT RECEIPT", pageWidth / 2, 20, { align: "center" });

    // Receipt details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    let yPos = 55;
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;

    // Receipt Info Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(leftMargin, yPos, pageWidth - 40, 25, 3, 3, "FD");

    yPos += 8;
    doc.setFont(undefined, "bold");
    doc.text("Receipt No:", leftMargin + 5, yPos);
    doc.setFont(undefined, "normal");
    doc.text(payment.id.substring(0, 8).toUpperCase(), leftMargin + 35, yPos);

    doc.setFont(undefined, "bold");
    doc.text("Date:", rightMargin - 50, yPos);
    doc.setFont(undefined, "normal");
    doc.text(new Date(payment.payment_date || payment.created_at).toLocaleDateString(), rightMargin - 20, yPos, {
      align: "right",
    });

    yPos += 8;
    doc.setFont(undefined, "bold");
    doc.text("Status:", leftMargin + 5, yPos);
    doc.setFont(undefined, "normal");
    doc.setTextColor(16, 185, 129);
    doc.text("PAID", leftMargin + 35, yPos);
    doc.setTextColor(0, 0, 0);

    // Student Information
    yPos += 20;
    doc.setFont(undefined, "bold");
    doc.setFontSize(14);
    doc.text("Student Information", leftMargin, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Name:", leftMargin, yPos);
    doc.setFont(undefined, "normal");
    doc.text(payment.students?.name || "N/A", leftMargin + 25, yPos);

    if (payment.students?.email) {
      yPos += 7;
      doc.setFont(undefined, "bold");
      doc.text("Email:", leftMargin, yPos);
      doc.setFont(undefined, "normal");
      doc.text(payment.students.email, leftMargin + 25, yPos);
    }

    if (payment.students?.phone) {
      yPos += 7;
      doc.setFont(undefined, "bold");
      doc.text("Phone:", leftMargin, yPos);
      doc.setFont(undefined, "normal");
      doc.text("0" + payment.students.phone, leftMargin + 25, yPos);
    }

    // Parent Information (if available)
    if (payment.students?.parent_name) {
      yPos += 15;
      doc.setFont(undefined, "bold");
      doc.setFontSize(14);
      doc.text("Parent/Guardian Information", leftMargin, yPos);

      yPos += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Name:", leftMargin, yPos);
      doc.setFont(undefined, "normal");
      doc.text(payment.students.parent_name, leftMargin + 25, yPos);

      if (payment.students?.parent_email) {
        yPos += 7;
        doc.setFont(undefined, "bold");
        doc.text("Email:", leftMargin, yPos);
        doc.setFont(undefined, "normal");
        doc.text(payment.students.parent_email, leftMargin + 25, yPos);
      }

      if (payment.students?.parent_phone) {
        yPos += 7;
        doc.setFont(undefined, "bold");
        doc.text("Phone:", leftMargin, yPos);
        doc.setFont(undefined, "normal");
        doc.text("0" + payment.students.parent_phone, leftMargin + 25, yPos);
      }
    }

    // Payment Details
    yPos += 20;
    doc.setFont(undefined, "bold");
    doc.setFontSize(14);
    doc.text("Payment Details", leftMargin, yPos);

    // Table header
    yPos += 12;
    doc.setFillColor(249, 250, 251);
    doc.rect(leftMargin, yPos - 5, pageWidth - 40, 10, "F");

    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Description", leftMargin + 5, yPos);
    doc.text("Package", rightMargin - 70, yPos);
    doc.text("Amount", rightMargin - 5, yPos, { align: "right" });

    // Table row
    yPos += 10;
    doc.setFont(undefined, "normal");
    doc.text(payment.description || "Tuition Fee", leftMargin + 5, yPos);
    doc.text(payment.package_type || "Standard", rightMargin - 70, yPos);
    doc.text(`GHS ${Number(payment.amount).toFixed(2)}`, rightMargin - 5, yPos, { align: "right" });

    // Discount if applicable
    if (payment.discount_amount && payment.discount_amount > 0) {
      yPos += 7;
      doc.setTextColor(239, 68, 68);
      doc.text("Discount", leftMargin + 5, yPos);
      doc.text(`-GHS ${Number(payment.discount_amount).toFixed(2)}`, rightMargin - 5, yPos, { align: "right" });
      doc.setTextColor(0, 0, 0);
    }

    // Total
    yPos += 15;
    doc.setDrawColor(0, 0, 0);
    doc.line(leftMargin, yPos - 5, rightMargin, yPos - 5);

    doc.setFont(undefined, "bold");
    doc.setFontSize(14);
    doc.text("Total Paid:", leftMargin + 5, yPos);
    doc.setTextColor(16, 185, 129);
    doc.text(`GHS ${Number(payment.paid_amount || payment.amount).toFixed(2)}`, rightMargin - 5, yPos, {
      align: "right",
    });
    doc.setTextColor(0, 0, 0);

    // Payment method
    if (payment.description) {
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Payment Method:", leftMargin + 5, yPos);
      doc.setFont(undefined, "normal");
      doc.text(payment.description, leftMargin + 45, yPos);
    }

    if (payment.payment_reference) {
      yPos += payment.description ? 7 : 10;
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Payment Reference:", leftMargin + 5, yPos);
      doc.setFont(undefined, "normal");
      doc.text(String(payment.payment_reference), leftMargin + 65, yPos);
    }

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text("Thank you for your payment!", pageWidth / 2, yPos, { align: "center" });

    yPos += 6;
    doc.setFontSize(8);
    doc.text("This is a computer-generated receipt and does not require a signature.", pageWidth / 2, yPos, {
      align: "center",
    });

    yPos += 5;
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });

    // Generate PDF as base64
    const pdfBase64 = doc.output("datauristring").split(",")[1];

    return new Response(
      JSON.stringify({
        success: true,
        pdf: pdfBase64,
        filename: `Receipt_${payment.id.substring(0, 8)}_${payment.students?.name?.replace(/\s+/g, "_")}.pdf`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error: any) {
    console.error("Error generating receipt:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
