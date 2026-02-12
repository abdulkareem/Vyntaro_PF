import "./globals.css";

export const metadata = {
  title: "PW Finance",
  description: "Personal Finance PWA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 dark:bg-slate-900">
        {children}
      </body>
    </html>
  );
}
