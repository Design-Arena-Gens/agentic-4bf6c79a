export const metadata = {
  title: "Agentic Chat (Local Models)",
  description: "Real-time voice chat with Ollama / LM Studio",
};

import "./globals.css";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
