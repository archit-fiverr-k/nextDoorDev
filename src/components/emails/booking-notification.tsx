import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BookingNotificationEmailProps {
  pharmacyName: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  serviceName: string;
  formattedTime: string;
  dashboardUrl: string;
}

export const BookingNotificationEmail = ({
  pharmacyName = "Local Pharmacy",
  patientName = "Patient Name",
  patientEmail = "patient@example.com",
  patientPhone = "555-0199",
  serviceName = "Flu Vaccination",
  formattedTime = "Monday, July 6, 2026 at 9:00 AM",
  dashboardUrl = "http://localhost:3000/login",
}: BookingNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>New Appointment Scheduled - {patientName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>NextDoorClinic</Text>
        </Section>
        <Heading style={heading}>New Appointment Booked</Heading>

        <Text style={paragraph}>Hi {pharmacyName} Staff,</Text>
        <Text style={paragraph}>
          A new appointment has been scheduled at your branch. Here are the patient and booking
          details:
        </Text>

        <Section style={detailsCard}>
          <Heading as="h4" style={sectionTitle}>
            PATIENT INFORMATION
          </Heading>
          <Text style={detailItem}>
            <strong>Name:</strong> {patientName}
          </Text>
          <Text style={detailItem}>
            <strong>Email:</strong> {patientEmail}
          </Text>
          <Text style={detailItem}>
            <strong>Phone:</strong> {patientPhone}
          </Text>

          <Hr style={innerHr} />

          <Heading as="h4" style={sectionTitle}>
            APPOINTMENT INFORMATION
          </Heading>
          <Text style={detailItem}>
            <strong>Service:</strong> {serviceName}
          </Text>
          <Text style={detailItem}>
            <strong>Date & Time:</strong> {formattedTime}
          </Text>
        </Section>

        <Section style={buttonContainer}>
          <Link href={dashboardUrl} style={button}>
            View in Dashboard
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          This is an automated notification sent to pharmacy staff. Do not reply to this email.
        </Text>
        <Text style={footer}>© 2026 NextDoorClinic. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
);

export default BookingNotificationEmail;

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
  fontSize: "22px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#1e293b",
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

const sectionTitle = {
  fontSize: "11px",
  fontWeight: "bold",
  color: "#64748b",
  letterSpacing: "1px",
  margin: "0 0 10px 0",
};

const detailItem = {
  fontSize: "13px",
  margin: "6px 0",
  color: "#475569",
};

const innerHr = {
  borderColor: "#e2e8f0",
  margin: "16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
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
