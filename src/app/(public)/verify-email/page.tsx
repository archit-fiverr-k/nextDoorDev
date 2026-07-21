import Link from "next/link";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export const revalidate = 0;

interface VerifyEmailPageProps {
  searchParams: {
    token?: string;
  };
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = searchParams.token;

  if (!token) {
    return <ErrorState message="Verification token is missing or has expired." />;
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "default_auth_secret_minimum_length_32_chars"
    );
    const { payload } = await jwtVerify(token, secret);
    const email = payload.email as string;

    if (!email) {
      return <ErrorState message="Invalid token payload." />;
    }

    // Find and update the customer with this token
    const customer = await db.customer.findFirst({
      where: {
        email,
        emailVerificationToken: token,
      },
    });

    if (!customer) {
      // Check if already verified
      const verifiedCustomer = await db.customer.findFirst({
        where: { email, emailVerified: true },
      });
      if (verifiedCustomer) {
        return <SuccessState email={email} alreadyVerified={true} />;
      }
      return <ErrorState message="Token is invalid or has already been used." />;
    }

    // Verify expiry
    if (customer.emailVerificationExpiry && new Date() > customer.emailVerificationExpiry) {
      return <ErrorState message="Verification token has expired. Please request a new one." />;
    }

    // Mark as verified
    await db.customer.update({
      where: { id: customer.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return <SuccessState email={email} alreadyVerified={false} />;
  } catch (err) {
    console.error("❌ Email verification failed:", err);
    return <ErrorState message="Invalid or expired verification token." />;
  }
}

function SuccessState({ email, alreadyVerified }: { email: string; alreadyVerified: boolean }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-6 py-12 font-sans dark:bg-zinc-950">
      <div className="dark:border-zinc-850/80 w-full max-w-md space-y-6 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-lg dark:bg-zinc-900/60">
        <div className="mb-2 inline-flex size-16 animate-bounce items-center justify-center rounded-full bg-emerald-500/10 text-[#10B981]">
          <CheckCircle2 className="size-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {alreadyVerified ? "Email Already Verified" : "Email Verified!"}
          </h2>
          <p className="text-sm font-normal leading-relaxed text-slate-500 dark:text-zinc-400">
            {alreadyVerified
              ? `The email address ${email} is already verified and active.`
              : `Your email address ${email} has been successfully verified. Your patient portal account is now active.`}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center space-x-2 rounded-xl bg-[#10B981] font-bold text-white shadow-md shadow-emerald-500/10 transition-all duration-200 hover:bg-[#059669] active:scale-[0.99]"
          >
            <span>Log in to Portal</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-6 py-12 font-sans dark:bg-zinc-950">
      <div className="dark:border-zinc-850/80 w-full max-w-md space-y-6 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-lg dark:bg-zinc-900/60">
        <div className="mb-2 inline-flex size-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
          <XCircle className="size-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Verification Failed
          </h2>
          <p className="text-slate-550 dark:text-zinc-450 text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="hover:bg-slate-205 dark:hover:bg-zinc-750 flex h-12 w-full items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-800 transition-all duration-200 dark:bg-zinc-800 dark:text-white"
          >
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
