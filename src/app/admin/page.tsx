import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import AdminPanel from "./admin-panel";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Admin · Useless Projects",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const jar = await cookies();
  const authed = isValidAdminSession(jar.get(ADMIN_COOKIE)?.value);

  return (
    <main data-page="handbook" className="w-full overflow-x-hidden bg-white text-[#0e0e0d]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-5 py-14 sm:px-8 sm:py-20">
        <h1 className="font-drowner leading-[0.95] text-[#0e0e0d]" style={{ fontSize: "clamp(28px, 5vw, 40px)" }}>
          admin
        </h1>
        {authed ? <AdminPanel /> : <LoginForm />}
      </div>
    </main>
  );
}
