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

interface CredentialsEmailProps {
  pharmacyName: string;
  loginEmail: string;
  defaultPassword: string;
  loginUrl: string;
}

export const CredentialsEmail = ({
  pharmacyName = "New Pharmacy Branch",
  loginEmail = "manager@pharmacy.com",
  defaultPassword = "TemporaryPassword123!",
  loginUrl = "http://localhost:3000/login",
}: CredentialsEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to NextDoorClinic - Your Workspace Credentials</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>NextDoorClinic</Text>
        </Section>
        <Heading style={heading}>Welcome to NextDoorClinic!</Heading>

        <Text style={paragraph}>Hi {pharmacyName} Manager,</Text>
        <Text style={paragraph}>
          Your clinic branch profile has been registered in our scheduling SaaS platform. You can
          now access your dedicated tenant workspace with the following credentials:
        </Text>

        <Section style={detailsCard}>
          <Text style={detailItem}>
            <strong>Login Email:</strong> {loginEmail}
          </Text>
          <Text style={detailItem}>
            <strong>Temporary Password:</strong> <code style={code}>{defaultPassword}</code>
          </Text>
        </Section>

        <Text style={warningText}>
          ⚠️ <strong>Security Notice:</strong> You will be prompted to change this temporary
          password immediately upon your first login.
        </Text>

        <Section style={buttonContainer}>
          <Link href={loginUrl} style={button}>
            Access Workspace Portal
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          This is a secure system notification. If you did not request this registry, please contact
          administration.
        </Text>
        <Text style={footer}>© 2026 NextDoorClinic. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
);

export default CredentialsEmail;

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

const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#b45309",
  backgroundColor: "#fffbeb",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #fef3c7",
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
