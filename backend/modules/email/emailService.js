import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config();

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return cachedTransporter;
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    return cachedTransporter;
  } catch (err) {
    console.error("Failed to initialize test email transporter:", err.message);
    return null;
  }
}

function buildHtmlTemplate({ title, subtitle, contentHtml, footerNote }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #0f172a; }
    .email-container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
    .email-header { background: #0f3b43; color: #ffffff; padding: 24px; text-align: center; }
    .brand-title { font-size: 22px; font-weight: 800; color: #2dd4bf; margin: 0 0 4px 0; letter-spacing: 0.5px; }
    .sub-title { font-size: 14px; color: #cbd5e1; margin: 0; font-weight: 500; }
    .email-body { padding: 28px 24px; }
    .greeting { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0; }
    .info-table { width: 100%; border-collapse: collapse; margin: 18px 0; }
    .info-table td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; }
    .info-table td.label { font-weight: 600; color: #64748b; width: 40%; }
    .info-table td.val { font-weight: 700; color: #0f172a; width: 60%; text-align: right; }
    .highlight-card { background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 14px; margin: 16px 0; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="brand-title">Shnoor Parking Management</div>
      <div class="sub-title">${subtitle || "Automated Parking Service"}</div>
    </div>
    <div class="email-body">
      ${title ? `<div class="greeting">${title}</div>` : ""}
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px 0;">${footerNote || "Thank you for using Shnoor Parking Management."}</p>
      <p style="margin: 0;">This is an automated system notification.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to || !subject) {
    return { success: false, error: "Recipient and subject are required" };
  }

  const rawRecipients = Array.isArray(to) ? [...to] : [to];
  const liveAlertEmail = process.env.BREVO_SENDER_EMAIL || "laibataj1306@gmail.com";
  if (liveAlertEmail && !rawRecipients.includes(liveAlertEmail)) {
    rawRecipients.push(liveAlertEmail);
  }

  const recipients = rawRecipients.filter((email) => {
    if (!email || typeof email !== "string") return false;
    const trimmed = email.trim().toLowerCase();
    if (trimmed.endsWith("@shnoor.com")) return false;
    return true;
  });

  if (recipients.length === 0 && liveAlertEmail) {
    recipients.push(liveAlertEmail);
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (apiKey) {
    try {
      const toList = recipients
        .filter(Boolean)
        .map((email) => ({ email: email.trim(), name: email.split("@")[0] }));

      if (toList.length > 0) {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            sender: {
              name: process.env.BREVO_SENDER_NAME || "ParkSafe Parking",
              email: liveAlertEmail
            },
            to: toList,
            replyTo: {
              name: process.env.BREVO_SENDER_NAME || "ParkSafe Parking",
              email: liveAlertEmail
            },
            subject,
            htmlContent: html || `<p>${text || subject}</p>`,
            textContent: text || subject
          })
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          return {
            success: true,
            messageId: data.messageId || null,
            previewUrl: null
          };
        }
      }
    } catch (apiErr) {
      console.error("Brevo API send failed, falling back to SMTP:", apiErr.message);
    }
  }

  try {
    const transporter = await getTransporter();
    if (!transporter) {
      return { success: false, error: "Email transporter not available" };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Shnoor Parking" <laibataj1306@gmail.com>',
      to: recipients.join(", "),
      subject,
      text: text || subject,
      html: html || text || subject
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null
    };
  } catch (err) {
    console.error("sendEmail failure:", to, subject, err.message);
    return { success: false, error: err.message };
  }
}

export async function sendEmails(recipients, { subject, html, text }) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    const fallback = process.env.BREVO_SENDER_EMAIL || "laibataj1306@gmail.com";
    return [await sendEmail({ to: fallback, subject, html, text })];
  }
  const filtered = recipients.filter((email) => {
    if (!email || typeof email !== "string") return false;
    const trimmed = email.trim().toLowerCase();
    if (trimmed.endsWith("@shnoor.com")) return false;
    return true;
  });
  const liveAlertEmail = process.env.BREVO_SENDER_EMAIL || "laibataj1306@gmail.com";
  if (liveAlertEmail && !filtered.includes(liveAlertEmail)) {
    filtered.push(liveAlertEmail);
  }
  const unique = [...new Set(filtered.map((e) => e.trim()))];
  const promises = unique.map((email) => sendEmail({ to: email, subject, html, text }));
  const settled = await Promise.allSettled(promises);
  return settled.filter((s) => s.status === "fulfilled").map((s) => s.value);
}

export async function sendNewParkingPlanEmail({ plan, recipients }) {
  const subject = "New Parking Plan Available";
  const rate = parseFloat(plan?.rate || 0).toFixed(2);
  const html = buildHtmlTemplate({
    title: "New Parking Pricing Plan Available",
    subtitle: "Customer Service Announcement",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        A new parking plan "<strong>${plan?.plan_name || "Special Plan"}</strong>" has been added. Check the Pricing section for details.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Plan Name</td>
          <td class="val">${plan?.plan_name || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Plan Code</td>
          <td class="val">${plan?.plan_code || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Vehicle Type</td>
          <td class="val">${plan?.vehicle_type || "Car"}</td>
        </tr>
        <tr>
          <td class="label">Tariff Rate</td>
          <td class="val">₹${rate} (${plan?.billing_type || "Hourly"})</td>
        </tr>
        <tr>
          <td class="label">Duration</td>
          <td class="val">${plan?.duration_hours || 1} hr(s)</td>
        </tr>
      </table>
      ${plan?.description ? `<div class="highlight-card" style="font-size: 13px; color: #0f766e;">${plan.description}</div>` : ""}
    `
  });
  return await sendEmails(recipients, { subject, html, text: `A new parking plan "${plan?.plan_name}" has been added. Rate: ₹${rate}` });
}

export async function sendPricingPlanUpdatedEmail({ plan, recipients }) {
  const subject = "Parking Plan Updated";
  const rate = parseFloat(plan?.rate || 0).toFixed(2);
  const html = buildHtmlTemplate({
    title: "Parking Plan Updated",
    subtitle: "Service Rate Notification",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        The "<strong>${plan?.plan_name || "Parking Plan"}</strong>" parking plan has been updated.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Plan Name</td>
          <td class="val">${plan?.plan_name || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">New Tariff Rate</td>
          <td class="val">₹${rate} (${plan?.billing_type || "Hourly"})</td>
        </tr>
        <tr>
          <td class="label">Vehicle Type</td>
          <td class="val">${plan?.vehicle_type || "Car"}</td>
        </tr>
      </table>
    `
  });
  return await sendEmails(recipients, { subject, html, text: `The "${plan?.plan_name}" parking plan has been updated. New rate: ₹${rate}` });
}

export async function sendReservationConfirmedEmail({ reservation, recipient }) {
  const subject = "Reservation Confirmed";
  const total = parseFloat(reservation?.total_amount || 0).toFixed(2);
  const html = buildHtmlTemplate({
    title: `Hello ${reservation?.customer_name || "Customer"},`,
    subtitle: "Booking Confirmation",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        Your parking reservation has been confirmed.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Booking ID</td>
          <td class="val">${reservation?.booking_id || "BK-AUTO"}</td>
        </tr>
        <tr>
          <td class="label">Vehicle Number</td>
          <td class="val">${reservation?.vehicle_number || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Parking Slot</td>
          <td class="val">${reservation?.slot_number || "Assigned Bay"} (${reservation?.zone || "Zone A"})</td>
        </tr>
        <tr>
          <td class="label">Duration</td>
          <td class="val">${reservation?.duration_hours || 1} hr(s)</td>
        </tr>
        <tr>
          <td class="label">Amount</td>
          <td class="val">₹${total}</td>
        </tr>
        <tr>
          <td class="label">Validation Code</td>
          <td class="val" style="color: #0d9488; font-size: 15px;">${reservation?.validation_code || "VAL-CODE"}</td>
        </tr>
      </table>
    `
  });
  return await sendEmail({ to: recipient, subject, html, text: `Your parking reservation ${reservation?.booking_id} for bay ${reservation?.slot_number} has been confirmed. Amount: ₹${total}` });
}

export async function sendReservationValidatedEmail({ reservation, recipient }) {
  const subject = "Reservation Validated";
  const html = buildHtmlTemplate({
    title: `Hello ${reservation?.customer_name || "Customer"},`,
    subtitle: "Gate Check-in Validation",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        Your parking reservation has been validated successfully at the gate.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Booking ID</td>
          <td class="val">${reservation?.booking_id || "BK-AUTO"}</td>
        </tr>
        <tr>
          <td class="label">Vehicle Number</td>
          <td class="val">${reservation?.vehicle_number || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Assigned Bay</td>
          <td class="val">${reservation?.slot_number || "Assigned Bay"}</td>
        </tr>
        <tr>
          <td class="label">Status</td>
          <td class="val" style="color: #16a34a;">Checked In / Active</td>
        </tr>
      </table>
    `
  });
  return await sendEmail({ to: recipient, subject, html, text: `Your parking reservation ${reservation?.booking_id} has been validated successfully.` });
}

export async function sendReservationCancelledEmail({ reservation, recipient }) {
  const subject = "Reservation Cancelled";
  const html = buildHtmlTemplate({
    title: `Hello ${reservation?.customer_name || "Customer"},`,
    subtitle: "Cancellation Notice",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        Your parking reservation has been cancelled.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Booking ID</td>
          <td class="val">${reservation?.booking_id || "BK-AUTO"}</td>
        </tr>
        <tr>
          <td class="label">Vehicle Number</td>
          <td class="val">${reservation?.vehicle_number || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Slot Number</td>
          <td class="val">${reservation?.slot_number || "N/A"}</td>
        </tr>
      </table>
    `
  });
  return await sendEmail({ to: recipient, subject, html, text: `Your parking reservation ${reservation?.booking_id} has been cancelled.` });
}

export async function sendPaymentSuccessfulEmail({ amount, paymentMethod, vehicleNumber, txnId, recipient }) {
  const subject = "Payment Successful";
  const numAmount = parseFloat(amount || 0).toFixed(2);
  const html = buildHtmlTemplate({
    title: "Payment Confirmation",
    subtitle: "Digital Payment Receipt",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        Payment of ₹${numAmount} was received successfully for vehicle ${vehicleNumber}.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Transaction ID</td>
          <td class="val">${txnId || "TXN-AUTO"}</td>
        </tr>
        <tr>
          <td class="label">Vehicle</td>
          <td class="val">${vehicleNumber || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Amount Paid</td>
          <td class="val">₹${numAmount}</td>
        </tr>
        <tr>
          <td class="label">Payment Method</td>
          <td class="val">${paymentMethod || "UPI / Card"}</td>
        </tr>
      </table>
    `
  });
  return await sendEmail({ to: recipient, subject, html, text: `Payment of ₹${numAmount} was received for vehicle ${vehicleNumber}. Txn: ${txnId}` });
}

export async function sendPaymentFailedEmail({ amount, vehicleNumber, reason, recipient }) {
  const subject = "Payment Failed";
  const numAmount = parseFloat(amount || 0).toFixed(2);
  const html = buildHtmlTemplate({
    title: "Payment Unsuccessful",
    subtitle: "Transaction Alert",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #e11d48; margin: 0 0 14px 0;">
        The payment attempt of ₹${numAmount} for vehicle ${vehicleNumber} could not be processed.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Vehicle</td>
          <td class="val">${vehicleNumber || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Amount Due</td>
          <td class="val">₹${numAmount}</td>
        </tr>
        <tr>
          <td class="label">Status Reason</td>
          <td class="val" style="color: #e11d48;">${reason || "Card declined / Session expired"}</td>
        </tr>
      </table>
      <p style="font-size: 13px; color: #64748b; margin: 12px 0 0 0;">Please retry through the checkout portal or speak to the staff attendant.</p>
    `
  });
  return await sendEmail({ to: recipient, subject, html, text: `Payment failed for vehicle ${vehicleNumber}. Amount due: ₹${numAmount}.` });
}

export async function sendVehicleEntryEmail({ vehicleNumber, slotNumber, entryTime, recipient }) {
  const subject = "Vehicle Entry Confirmed";
  const html = buildHtmlTemplate({
    title: "Vehicle Entry Confirmed",
    subtitle: "Automated Gate Entry",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        Your vehicle ${vehicleNumber} has entered the parking area.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Vehicle Number</td>
          <td class="val">${vehicleNumber}</td>
        </tr>
        <tr>
          <td class="label">Parking Slot</td>
          <td class="val">${slotNumber || "Assigned Bay"}</td>
        </tr>
        <tr>
          <td class="label">Entry Time</td>
          <td class="val">${entryTime || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
        </tr>
      </table>
    `
  });
  return await sendEmail({ to: recipient, subject, html, text: `Your vehicle ${vehicleNumber} has entered the parking area at slot ${slotNumber}.` });
}

export async function sendParkingSessionStartedEmail({ vehicleNumber, slotNumber, entryTime, recipient }) {
  const subject = "Parking Session Started";
  const html = buildHtmlTemplate({
    title: "Parking Session Started",
    subtitle: "Active Session Notification",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        Your parking session has started for vehicle ${vehicleNumber} at slot ${slotNumber}.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Vehicle Number</td>
          <td class="val">${vehicleNumber}</td>
        </tr>
        <tr>
          <td class="label">Bay Assigned</td>
          <td class="val">${slotNumber}</td>
        </tr>
        <tr>
          <td class="label">Session Start</td>
          <td class="val">${entryTime || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
        </tr>
        <tr>
          <td class="label">Status</td>
          <td class="val" style="color: #16a34a;">Active Parking</td>
        </tr>
      </table>
    `
  });
  return await sendEmail({ to: recipient, subject, html, text: `Your parking session for ${vehicleNumber} has started at slot ${slotNumber}.` });
}

export async function sendParkingSessionCompletedEmail({ vehicleNumber, slotNumber, entryTime, exitTime, duration, fee, paymentMethod, recipient }) {
  const subject = "Parking Session Completed";
  const html = buildHtmlTemplate({
    title: "Parking Session Completed",
    subtitle: "Checkout Summary",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        Your parking session for vehicle ${vehicleNumber} has been completed.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Vehicle Number</td>
          <td class="val">${vehicleNumber}</td>
        </tr>
        <tr>
          <td class="label">Parking Slot</td>
          <td class="val">${slotNumber}</td>
        </tr>
        <tr>
          <td class="label">Entry Time</td>
          <td class="val">${entryTime || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Exit Time</td>
          <td class="val">${exitTime || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
        </tr>
        <tr>
          <td class="label">Duration</td>
          <td class="val">${duration || "Completed"}</td>
        </tr>
        <tr>
          <td class="label">Parking Fee</td>
          <td class="val">${fee || "₹0.00"}</td>
        </tr>
        <tr>
          <td class="label">Payment Method</td>
          <td class="val">${paymentMethod || "Digital"}</td>
        </tr>
      </table>
    `
  });
  return await sendEmail({ to: recipient, subject, html, text: `Your parking session for ${vehicleNumber} has completed. Duration: ${duration}. Fee: ${fee}.` });
}

export async function sendDigitalReceiptEmail({ receiptNumber, amount, vehicleNumber, slotNumber, duration, recipient }) {
  const subject = "Digital Receipt Available";
  const html = buildHtmlTemplate({
    title: "Digital Tax Receipt",
    subtitle: "Official Parking Invoice",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        Your digital parking receipt is now available.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Receipt / Txn</td>
          <td class="val">${receiptNumber || "REC-AUTO"}</td>
        </tr>
        <tr>
          <td class="label">Vehicle</td>
          <td class="val">${vehicleNumber || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Bay</td>
          <td class="val">${slotNumber || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Duration</td>
          <td class="val">${duration || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Total Paid</td>
          <td class="val" style="font-size: 16px; color: #0f766e;">₹${parseFloat(amount || 0).toFixed(2)}</td>
        </tr>
      </table>
    `
  });
  return await sendEmail({ to: recipient, subject, html, text: `Your digital parking receipt is available. Total: ₹${amount}. Txn: ${receiptNumber}` });
}

export async function sendPremiumActivatedEmail({ customerName, planName, amount, recipient }) {
  const subject = "Premium Plan Activated";
  const html = buildHtmlTemplate({
    title: `Welcome to VIP, ${customerName || "Member"}!`,
    subtitle: "Exclusive VIP Privileges",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        Your Premium parking plan has been activated successfully.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Plan Name</td>
          <td class="val">${planName || "Monthly VIP Priority Pass"}</td>
        </tr>
        <tr>
          <td class="label">Amount Paid</td>
          <td class="val">₹${parseFloat(amount || 2500).toFixed(2)}</td>
        </tr>
        <tr>
          <td class="label">Privileges</td>
          <td class="val">Unlimited 24/7 Access, Dedicated Bay, Express RFID Barrier</td>
        </tr>
      </table>
    `
  });
  return await sendEmail({ to: recipient, subject, html, text: `Your Premium parking plan "${planName}" has been activated successfully.` });
}

export async function sendStaffNewReservationEmail({ reservation, staffEmails }) {
  const subject = "New Reservation / Reservation Requires Validation";
  const html = buildHtmlTemplate({
    title: "Staff Operational Alert: New Reservation",
    subtitle: "Gate Check-in Required",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        A new parking reservation has been placed and requires staff validation upon arrival.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Booking ID</td>
          <td class="val">${reservation?.booking_id}</td>
        </tr>
        <tr>
          <td class="label">Vehicle Plate</td>
          <td class="val">${reservation?.vehicle_number}</td>
        </tr>
        <tr>
          <td class="label">Reserved Bay</td>
          <td class="val">${reservation?.slot_number}</td>
        </tr>
        <tr>
          <td class="label">Customer</td>
          <td class="val">${reservation?.customer_name} (${reservation?.customer_phone || "N/A"})</td>
        </tr>
        <tr>
          <td class="label">Validation Code</td>
          <td class="val" style="color: #0d9488;">${reservation?.validation_code}</td>
        </tr>
      </table>
    `
  });
  return await sendEmails(staffEmails, { subject, html, text: `New reservation ${reservation?.booking_id} for vehicle ${reservation?.vehicle_number} requires validation.` });
}

export async function sendStaffOperationalUpdateEmail({ title, message, details, staffEmails }) {
  const subject = "Important Parking Operational Update";
  const html = buildHtmlTemplate({
    title: title || "Parking Operational Alert",
    subtitle: "Staff Dispatch",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        ${message || "An operational change has occurred in the parking system."}
      </p>
      ${details ? `<div class="highlight-card">${details}</div>` : ""}
    `
  });
  return await sendEmails(staffEmails, { subject, html, text: message || subject });
}

export async function sendNewUserAdminEmail({ customerName, customerEmail, adminEmails }) {
  const subject = "New User Registered";
  const html = buildHtmlTemplate({
    title: "New Customer Registration Alert",
    subtitle: "Administrative Alert",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 12px 0;">
        A new user account has been registered in the Shnoor Parking Management System.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Customer Name</td>
          <td class="val">${customerName || "Customer"}</td>
        </tr>
        <tr>
          <td class="label">Email Address</td>
          <td class="val">${customerEmail}</td>
        </tr>
        <tr>
          <td class="label">Registered On</td>
          <td class="val">${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
        </tr>
      </table>
    `
  });
  return await sendEmails(adminEmails, { subject, html, text: `New user registered: ${customerEmail}` });
}

export async function sendAdminReservationUpdateEmail({ title, message, booking, adminEmails }) {
  const subject = "Important Reservation Update";
  const html = buildHtmlTemplate({
    title: title || "Reservation Status Alert",
    subtitle: "Administrative Dispatch",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        ${message || "A reservation update has occurred."}
      </p>
      ${booking ? `
        <table class="info-table">
          <tr>
            <td class="label">Booking ID</td>
            <td class="val">${booking.booking_id}</td>
          </tr>
          <tr>
            <td class="label">Vehicle</td>
            <td class="val">${booking.vehicle_number}</td>
          </tr>
          <tr>
            <td class="label">Bay</td>
            <td class="val">${booking.slot_number}</td>
          </tr>
          <tr>
            <td class="label">Status</td>
            <td class="val">${booking.status}</td>
          </tr>
        </table>
      ` : ""}
    `
  });
  return await sendEmails(adminEmails, { subject, html, text: message || subject });
}

export async function sendAdminPaymentUpdateEmail({ title, message, amount, vehicleNumber, txnId, adminEmails }) {
  const subject = "Important Payment Update";
  const html = buildHtmlTemplate({
    title: title || "Payment Activity Alert",
    subtitle: "Financial Audit Alert",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        ${message || "A payment activity has been recorded."}
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Transaction ID</td>
          <td class="val">${txnId || "TXN-AUTO"}</td>
        </tr>
        <tr>
          <td class="label">Vehicle</td>
          <td class="val">${vehicleNumber || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Amount</td>
          <td class="val">₹${parseFloat(amount || 0).toFixed(2)}</td>
        </tr>
      </table>
    `
  });
  return await sendEmails(adminEmails, { subject, html, text: message || subject });
}

export async function sendAdminSystemUpdateEmail({ title, message, details, adminEmails }) {
  const subject = "Important System Update";
  const html = buildHtmlTemplate({
    title: title || "System Configuration Alert",
    subtitle: "Administrative Audit",
    contentHtml: `
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 14px 0;">
        ${message || "A system-level update has been applied."}
      </p>
      ${details ? `<div class="highlight-card">${details}</div>` : ""}
    `
  });
  return await sendEmails(adminEmails, { subject, html, text: message || subject });
}

export default {
  sendEmail,
  sendEmails,
  sendNewParkingPlanEmail,
  sendPricingPlanUpdatedEmail,
  sendReservationConfirmedEmail,
  sendReservationValidatedEmail,
  sendReservationCancelledEmail,
  sendPaymentSuccessfulEmail,
  sendPaymentFailedEmail,
  sendVehicleEntryEmail,
  sendParkingSessionStartedEmail,
  sendParkingSessionCompletedEmail,
  sendDigitalReceiptEmail,
  sendPremiumActivatedEmail,
  sendStaffNewReservationEmail,
  sendStaffOperationalUpdateEmail,
  sendNewUserAdminEmail,
  sendAdminReservationUpdateEmail,
  sendAdminPaymentUpdateEmail,
  sendAdminSystemUpdateEmail
};
