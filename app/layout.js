import './globals.css'
import './layout-fixes.css'
import './shop/shop.css'
import './experience.css'
import { GeistSans } from 'geist/font/sans'

export const metadata = {
  title: 'OrderFlow',
  description: 'Simple order management for social sellers.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return <html lang="en" className={GeistSans.variable}><body className={GeistSans.className}>{children}</body></html>
}
