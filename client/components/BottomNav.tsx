'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/items', label: 'Items', icon: '📦' },
  { href: '/search', label: 'Scan/Search', icon: '🔍' },
  { href: '/items/new', label: 'Add', icon: '➕' },
  { href: '/movements', label: 'Movements', icon: '↕️' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} className={pathname === tab.href ? 'active' : ''}>
          <span aria-hidden>{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
