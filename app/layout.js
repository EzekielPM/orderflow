import './globals.css'
import './layout-fixes.css'
import './shop/shop.css'
import './experience.css'
import './iteration.css'
import { GeistSans } from 'geist/font/sans'
import TradeFlowBranding from './tradeflow-branding'

export const metadata = {
  title: 'TradeFlow',
  description: 'A simple commerce flow for vendors and buyers, from order to delivery.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return <html lang="en" className={GeistSans.variable}><body className={GeistSans.className}><TradeFlowBranding />{children}</body></html>
}
