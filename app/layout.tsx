import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RW Store 2.0",
  description: "Live inventory, instant delivery.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body className="h-[100dvh] flex flex-col">
        {/* TEMPORARY ERROR LOGGER — REMOVE AFTER DEBUGGING */}
        <div 
          id="crash-log" 
          style={{ 
            display: 'none', 
            background: 'red', 
            color: 'white', 
            padding: '16px', 
            fontFamily: 'monospace', 
            fontSize: '12px', 
            zIndex: 9999, 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            maxHeight: '50vh', 
            overflow: 'auto', 
            whiteSpace: 'pre-wrap' 
          }} 
        />
        <script dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('error', function(e) {
              var log = document.getElementById('crash-log');
              if (!log) return;
              log.style.display = 'block';
              log.textContent += 'ERROR: ' + e.message + '\\nAt: ' + e.filename + ':' + e.lineno + ':' + e.colno + '\\n' + (e.error && e.error.stack ? e.error.stack : '') + '\\n\\n';
            });
            window.addEventListener('unhandledrejection', function(e) {
              var log = document.getElementById('crash-log');
              if (!log) return;
              log.style.display = 'block';
              log.textContent += 'PROMISE REJECTION: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason)) + '\\n' + (e.reason && e.reason.stack ? e.reason.stack : '') + '\\n\\n';
            });
          `
        }} />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}