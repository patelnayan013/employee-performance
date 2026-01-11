import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Update Password | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Update Password Page TailAdmin Dashboard Template",
};

export default function UpdatePassword() {
  return <UpdatePasswordForm />;
}
