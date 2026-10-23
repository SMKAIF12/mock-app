import "./globals.css";

export const metadata = {
  title: "AI Agents",
  description: "AI Agent Management UI"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}