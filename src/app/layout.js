import { Inter } from 'next/font/google'
import "../styles/globals.css";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: "Useless Projects | TinkerHub",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={inter.className}>
        {children}
      </body>
    </html>
  );
}
