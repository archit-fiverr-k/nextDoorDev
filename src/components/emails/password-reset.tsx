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

interface PasswordResetEmailProps {
  userEmail: string;
  resetUrl: string;
}

export const PasswordResetEmail = ({
  userEmail = "user@example.com",
  resetUrl = "http://localhost:3000/reset-password?token=mock-token",
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your NextDoorClinic password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>NextDoorClinic</Text>
        </Section>
        <Heading style={heading}>Reset Your Password</Heading>

        <Text style={paragraph}>Hi {userEmail},</Text>
        <Text style={paragraph}>
          We received a request to reset your password. You can reset it by clicking the button
          below. This link is valid for 1 hour.
        </Text>

        <Section style={buttonContainer}>
          <Link href={resetUrl} style={button}>
            Reset Password
          </Link>
        </Section>

        <Text style={paragraph}>
          If you did not request a password reset, you can safely ignore this email. Your password
          will remain unchanged.
        </Text>

        <Hr style={hr} />

        <Text style={linkText}>{resetUrl}</Text>

        <Hr style={hr} />

        <Text style={footer}>This is an automated notification. Do not reply to this email.</Text>
        <Text style={footer}>© 2026 NextDoorClinic. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

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
  margin: "20px 0",
};

const linkText = {
  fontSize: "12px",
  color: "#2563eb",
  wordBreak: "break-all" as const,
};

const footer = {
  fontSize: "11px",
  lineHeight: "16px",
  color: "#94a3b8",
  margin: "4px 0",
};
