import './globals.css'

export const metadata = {
  title: 'Asta Live Fantacalcio Mantra',
  description: 'Gestione Asta Live Mantra con Google Sheets',
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
