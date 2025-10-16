import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            SwitchedHit
          </Link>
          <div className="flex space-x-6">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/teams" className="hover:text-primary transition-colors">
              Teams
            </Link>
            <Link href="/matches" className="hover:text-primary transition-colors">
              Matches
            </Link>
            <Link href="/admin" className="hover:text-primary transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
