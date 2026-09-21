import './globals.css'
import './layout-fixes.css'

export const metadata = {
  title: 'OrderFlow',
  description: 'Simple order management for social sellers.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>
}
