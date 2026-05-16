import "./globals.css";

export const metadata = { title: "Botlane Lab V5", description: "Analyse française du duo botlane" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
