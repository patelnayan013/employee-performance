import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Reset Password Page TailAdmin Dashboard Template",
};

export default function ResetPassword() {
  return <ResetPasswordForm />;
}
