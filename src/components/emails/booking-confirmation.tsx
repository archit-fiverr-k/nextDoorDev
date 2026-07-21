import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BookingConfirmationEmailProps {
  patientName: string;
  branchName: string;
  serviceName: string;
  formattedTime: string;
  bookingId: string;
}

export const BookingConfirmationEmail = ({
  patientName = "Patient",
  branchName = "Local Pharmacy",
  serviceName = "Consultation",
  formattedTime = "Monday, July 6, 2026 at 9:00 AM",
  bookingId = "ABCD-1234",
}: BookingConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your NextDoorClinic appointment has been confirmed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>NextDoorClinic</Text>
        </Section>
        <Heading style={heading}>Booking Confirmed!</Heading>
        <Text style={paragraph}>Hi {patientName},</Text>
        <Text style={paragraph}>
          Your appointment at <strong>{branchName}</strong> has been successfully scheduled. Here
          are your booking details:
        </Text>

        <Section style={detailsCard}>
          <Text style={detailItem}>
            <strong>Service:</strong> {serviceName}
          </Text>
          <Text style={detailItem}>
            <strong>Date & Time:</strong> {formattedTime}
          </Text>
          <Text style={detailItem}>
            <strong>Reference ID:</strong> <code style={code}>{bookingId}</code>
          </Text>
        </Section>

        <Text style={paragraph}>
          Please arrive 5 minutes before your scheduled appointment time. If you need to cancel or
          reschedule, please contact the branch directly.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          This is an automated notification. If you did not request this booking, please discard
          this message.
        </Text>
        <Text style={footer}>© 2026 NextDoorClinic. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
);

export default BookingConfirmationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "580px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
};

const logoSection = {
  paddingBottom: "20px",
  borderBottom: "1px solid #f1f5f9",
};

const logoText = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#2563eb",
  margin: "0",
};

const heading = {
  fontSize: "24px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#16a34a",
  marginTop: "24px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#334155",
};

const detailsCard = {
  backgroundColor: "#f8fafc",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #f1f5f9",
  margin: "20px 0",
};

const detailItem = {
  fontSize: "13px",
  margin: "6px 0",
  color: "#475569",
};

const code = {
  fontFamily: "monospace",
  fontWeight: "bold",
  color: "#0f172a",
  backgroundColor: "#e2e8f0",
  padding: "2px 6px",
  borderRadius: "4px",
};

const hr = {
  borderColor: "#f1f5f9",
  margin: "24px 0",
};

const footer = {
  fontSize: "11px",
  lineHeight: "16px",
  color: "#94a3b8",
  margin: "4px 0",
};
