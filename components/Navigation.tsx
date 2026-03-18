'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RiMap2Fill, RiFlashlightFill, RiFlag2Fill } from 'react-icons/ri';
import { GiCrossedSwords } from 'react-icons/gi';

const NAV_ITEMS = [
  { href: '/map',    Icon: RiMap2Fill,       label: 'Map'    },
  { href: '/log',    Icon: RiFlashlightFill, label: 'Log'    },
  { href: '/rivals', Icon: GiCrossedSwords,  label: 'Rivals' },
  { href: '/goals',  Icon: RiFlag2Fill,      label: 'Goals'  },
];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const playerColor = session?.user?.color ?? 'var(--bhuvi)';

  return (
    <nav
      className="bottom-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      <div className="grid grid-cols-4 px-3 py-2 gap-1">
        {NAV_ITEMS.map(({ href, Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="nav-tab-btn"
              style={{
                background: isActive
                  ? `linear-gradient(150deg, ${playerColor}1A, ${playerColor}08)`
                  : 'transparent',
                border: `1px solid ${isActive ? playerColor + '30' : 'transparent'}`,
              }}
            >
              {/* Active indicator line at top */}
              {isActive && (
                <div
                  className="nav-tab-indicator"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${playerColor}, transparent)`,
                    boxShadow: `0 0 10px ${playerColor}`,
                  }}
                />
              )}

              <Icon
                size={22}
                style={{
                  color: isActive ? playerColor : 'var(--muted)',
                  filter: isActive ? `drop-shadow(0 0 8px ${playerColor})` : 'none',
                  transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                  transform: isActive ? 'scale(1.14) translateY(-1px)' : 'scale(1)',
                }}
              />

              <span
                className="nav-tab-label"
                style={{ color: isActive ? playerColor : 'var(--muted)' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
