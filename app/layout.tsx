import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./ui/style/globals.css";
import { ClusterProvider } from "./providers/dao-provider";
import { WalletContextProvider } from "./providers/wallet-provider";
import { TanstackProvider } from "./providers/tanstack-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bonk DAO Voting",
  description: "Participate in the Bonk DAO Voting. Powered by Realms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TanstackProvider>
          <ClusterProvider>
            <WalletContextProvider>
              {children}
            </WalletContextProvider>
          </ClusterProvider>
        </TanstackProvider>
      </body>
    </html>
  );
}
