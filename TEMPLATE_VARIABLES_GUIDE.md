# Template Variable Replacement System

## Overview

The messaging system now supports dynamic template variables using **double curly braces** `{{variable}}` syntax. Variables are automatically replaced with recipient-specific data when messages are sent.

## How It Works

### Template Format
```
Dear {{name}},

This is a friendly reminder that your payment of {{amount}} is due on {{date}}.

Please make your payment at your earliest convenience.

Thank you!
```

### Variable Data
```javascript
{
  name: "Kwame",
  amount: "GHS 300",
  date: "15th December 2025"
}
```

### Result
```
Dear Kwame,

This is a friendly reminder that your payment of GHS 300 is due on 15th December 2025.

Please make your payment at your earliest convenience.

Thank you!
```

## Available Variables

The following variables are automatically populated based on the recipient type and context:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{name}}` | Recipient's full name | "Kwame Mensah" |
| `{{amount}}` | Payment amount (for payment-related messages) | "GHS 300" |
| `{{date}}` | Due date or lesson date | "15th December 2025" |
| `{{instrument}}` | Student's instrument | "Piano" |
| `{{subject}}` | Lesson subject (alias for instrument) | "Piano" |
| `{{tutor}}` | Tutor's name | "Mr. Johnson" |
| `{{time}}` | Lesson time | "3:00 PM" |
| `{{type}}` | Recipient type | "student", "parent", "tutor" |

## Recipient Type Context

Different recipient types have different data available:

### All Students / All Parents
- ✅ `{{name}}`
- ✅ `{{instrument}}`
- ✅ `{{subject}}`
- ❌ `{{amount}}`, `{{date}}` (not available)

### Pending Payments
- ✅ `{{name}}`
- ✅ `{{amount}}` (automatically formatted with "GHS")
- ✅ `{{date}}` (formatted as "15th December 2025")
- ✅ `{{instrument}}`
- ✅ `{{subject}}`

### Individual Recipients
- ✅ All variables (if data is provided)
- Note: You may need to manually add extra fields when selecting individual recipients

## Usage Examples

### Payment Reminder Email
```
Subject: Payment Reminder for {{name}}

Dear {{name}},

This is a friendly reminder that your payment of {{amount}} is due on {{date}}.

Please make your payment at your earliest convenience.

Thank you!
```

### Lesson Confirmation
```
Subject: Lesson Confirmation - {{subject}}

Hi {{name}},

This confirms your {{subject}} lesson scheduled for {{date}} at {{time}} with {{tutor}}.

See you there!
```

### SMS Reminder
```
Hi {{name}}, reminder: {{amount}} payment due on {{date}}. Thank you!
```

## Important Rules

1. **Exact Matching**: Variable names must match exactly (case-sensitive)
2. **Unchanged Placeholders**: If a variable doesn't have data, it stays as `{{variable}}`
3. **Formatting Preserved**: All line breaks, spaces, and punctuation remain intact
4. **No Manual Values**: Variables are automatically populated - never hardcode values

## Implementation Details

### Frontend (`src/lib/utils.ts`)
```typescript
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in variables ? String(variables[key]) : match;
  });
}
```

### Backend (`supabase/functions/send-message/index.ts`)
- Template variables are replaced **per recipient** before sending
- Each recipient gets a personalized message with their own data
- Variables are built from recipient object fields

## Tips

- Use descriptive variable names that match your data structure
- Test templates with sample data before sending to all recipients
- Keep SMS messages under 160 characters when possible
- Use the "Payment Reminder" template for pending payments to get amount and date automatically

## Troubleshooting

**Variable not replacing?**
- Check spelling and case sensitivity
- Verify the data is available for that recipient type
- Ensure you're using `{{variable}}` not `{variable}`

**All recipients getting same data?**
- This shouldn't happen - each recipient gets their own data
- Check the edge function logs for errors
