import { AuthGuard } from "@/components/Auth/AuthGuard";
import { AppShell } from "@/components/Layout/AppShell";
import "./globals.css";

export const metadata = {
  title: "Learning Management System",
  description: "Udemy clone LMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
