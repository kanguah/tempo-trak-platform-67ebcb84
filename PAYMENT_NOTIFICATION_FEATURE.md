# Payment Verification Notification Feature

## Overview
A new feature has been added to send automatic message notifications (via Email and SMS) to students when their payment is verified.

## Changes Made

### 1. **Payments.tsx** - Import Added
- Added import for `useSendMessage` hook from `@/hooks/useMessaging`
- This enables message sending functionality within the Payments component

### 2. **Payments Component Hook**
- Initialized `sendMessageMutation` using the `useSendMessage()` hook
- This mutation is used to send messages asynchronously

### 3. **verifyPaymentMutation - Enhanced**
The payment verification mutation now includes:

#### Mutation Function:
- Updated to fetch payment details including student information after updating the payment status
- Returns the complete payment data with student details

#### onSuccess Handler:
- After successful payment verification, the system automatically sends notifications
- **Message Content:**
  - Includes student name and paid amount
  - Indicates if payment was "fully paid" or "partially paid"
  - Thanks the student for their payment

- **Multi-channel Support:**
  - **Email:** Sent to student's email address with subject "Payment Verification Confirmation"
  - **SMS:** Sent to student's phone number with the verification message
  - Messages are only sent if the respective contact information (email/phone) is available

### 4. **bulkMarkPaidMutation - Enhanced**
Similar enhancements for bulk payment marking:

#### Mutation Function:
- Updated to fetch all updated payments with student information after marking them as paid
- Returns the updated payments data

#### onSuccess Handler:
- For each payment marked as paid, sends notification messages
- Follows the same multi-channel approach (Email and SMS)
- Messages are sent individually for each payment in the bulk operation

## Message Template

**Email Subject:** `Payment Verification Confirmation`

**Message Body:**
```
Hi [Student Name], your payment of GH₵[Amount] has been [fully paid/partially paid]. Thank you for your payment!
```

## How It Works

1. **Individual Payment Verification:**
   - User selects a payment and clicks "Verify Payment"
   - Selects payment method and amount (full or partial)
   - Clicks "Verify" button
   - System updates payment status
   - If student has email → Email notification sent
   - If student has phone → SMS notification sent

2. **Bulk Payment Marking:**
   - User selects multiple payments
   - Clicks "Mark as Paid"
   - Selects payment method
   - Confirms action
   - System marks all selected payments as completed
   - Each student receives notification via their available channels

## Data Flow

```
Payment Verification → Fetch Student Details → Send Email Notification
                                            → Send SMS Notification
```

## Dependencies

- `useSendMessage` hook from `@/hooks/useMessaging`
- Student table with email and phone fields
- Messages table and send-message edge function (existing)

## Benefits

1. **Automatic Confirmation:** Students are automatically notified when their payment is verified
2. **Multi-channel:** Supports both email and SMS for better reach
3. **Professional Communication:** Personalized messages with student names and amounts
4. **Bulk Efficiency:** Bulk payment marking sends notifications to all students at once
5. **Conditional Sending:** Messages are only sent if contact information is available

## Testing

To test the feature:
1. Go to Payments page
2. Select a pending payment
3. Click "Verify Payment"
4. Fill in the payment method
5. Click "Verify"
6. Check that the notification messages are sent (watch for toast notifications)
7. Verify messages appear in the Messages table

## Future Enhancements

- Custom message templates for payment notifications
- Notification preferences per student
- Receipt PDF attachment in email notifications
- Webhook notifications for third-party integrations
- Scheduled/delayed notifications
