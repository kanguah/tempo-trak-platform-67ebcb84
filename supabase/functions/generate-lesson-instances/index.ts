import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { addDays, startOfWeek, format } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { year, month } = await req.json();
    
    console.log(`Generating lesson instances for ${year}-${month} for user ${user.id}`);

    // Get first and last day of the month
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // Fetch active recurrence rules for this user
    const { data: rules, error: rulesError } = await supabase
      .from("lesson_recurrence_rules")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (rulesError) {
      throw rulesError;
    }

    if (!rules || rules.length === 0) {
      console.log("No active recurrence rules found");
      return new Response(
        JSON.stringify({ message: "No recurrence rules to process", generated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Found ${rules.length} recurrence rules`);

    // Check which instances already exist for this month
    const { data: existingLessons, error: existingError } = await supabase
      .from("lessons")
      .select("lesson_date, recurrence_rule_id")
      .eq("user_id", user.id)
      .gte("lesson_date", format(firstDay, "yyyy-MM-dd"))
      .lte("lesson_date", format(lastDay, "yyyy-MM-dd"))
      .not("recurrence_rule_id", "is", null);

    if (existingError) {
      throw existingError;
    }

    const existingSet = new Set(
      (existingLessons || []).map((l: any) => `${l.recurrence_rule_id}-${l.lesson_date}`)
    );

    console.log(`Found ${existingSet.size} existing lesson instances for this month`);

    const lessonsToInsert = [];

    // Generate instances for each rule
    for (const rule of rules) {
      // Skip if rule end_date is before the month
      if (rule.end_date && new Date(rule.end_date) < firstDay) {
        continue;
      }

      // Skip if rule start_date is after the month
      if (new Date(rule.start_date) > lastDay) {
        continue;
      }

      // Calculate occurrences based on recurrence type
      const weekIncrement = rule.recurrence_type === "weekly" ? 1 : 
                           rule.recurrence_type === "biweekly" ? 2 : 4;

      // Start from the rule's start date
      const ruleStartDate = new Date(rule.start_date);
      const weekStart = startOfWeek(ruleStartDate, { weekStartsOn: 1 });
      
      // Calculate first occurrence in this month
      let currentDate = addDays(weekStart, rule.day_of_week);
      
      // If the first occurrence is before the month, advance to first occurrence in month
      while (currentDate < firstDay) {
        currentDate = addDays(currentDate, weekIncrement * 7);
      }

      // Generate all occurrences for this month
      while (currentDate <= lastDay) {
        // Check if this instance already exists
        const instanceKey = `${rule.id}-${format(currentDate, "yyyy-MM-dd")}`;
        if (!existingSet.has(instanceKey)) {
          // Check if we're past the rule's end date
          if (rule.end_date && currentDate > new Date(rule.end_date)) {
            break;
          }

          lessonsToInsert.push({
            user_id: user.id,
            student_id: rule.student_id,
            tutor_id: rule.tutor_id,
            subject: rule.subject,
            day_of_week: rule.day_of_week,
            start_time: rule.start_time,
            duration: rule.duration,
            room: rule.room,
            lesson_date: format(currentDate, "yyyy-MM-dd"),
            status: "scheduled",
            recurrence_rule_id: rule.id,
          });
        }

        // Move to next occurrence
        currentDate = addDays(currentDate, weekIncrement * 7);
      }
    }

    console.log(`Generated ${lessonsToInsert.length} new lesson instances`);

    if (lessonsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("lessons")
        .insert(lessonsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Lesson instances generated successfully",
        generated: lessonsToInsert.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating lesson instances:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
