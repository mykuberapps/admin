import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast-provider";
import { UploadProvider } from "@/components/UploadProvider";
import { AppShell } from "@/components/AppShell";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: "Kuber Admin | Million Dollar Dashboard",
  description: "Advanced User Management & Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ToastProvider>
          <GlobalErrorHandler>
            <UploadProvider>
              <AppShell>
                {children}
              </AppShell>
            </UploadProvider>
          </GlobalErrorHandler>
        </ToastProvider>
      </body>
    </html>
  );
}