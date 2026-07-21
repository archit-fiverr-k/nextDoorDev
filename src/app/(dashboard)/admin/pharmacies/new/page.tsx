import { RegisterPharmacyForm } from "./register-form";
import { H1, P } from "@/components/ui/typography";

export default function AdminRegisterPharmacyPage() {
  return (
    <div className="space-y-6">
      <div>
        <H1>Register Pharmacy</H1>
        <P className="mt-1">
          Create a new tenant pharmacy space. New records default to PENDING status and require
          super admin verification.
        </P>
      </div>

      <RegisterPharmacyForm />
    </div>
  );
}
