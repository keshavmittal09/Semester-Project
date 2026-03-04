"use client";
import { LayoutDashboard, Stethoscope, Clock, BarChart3, FileText, Zap, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { icon: LayoutDashboard, label: 'Home', href: '/' },
        { icon: Stethoscope, label: 'Diagnose', href: '/diagnose', badge: 'AI' },
        { icon: Clock, label: 'History', href: '/history' },
        { icon: BarChart3, label: 'Analytics', href: '/analytics' },
        { icon: FileText, label: 'Reports', href: '/reports' },
        { icon: User, label: 'Profile', href: '/profile' },
        { icon: Settings, label: 'Settings', href: '/settings' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">🧬</div>
                <div className="brand-text">
                    <h2>MedAI</h2>
                    <span>Diagnostics</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Navigation</div>
                {navItems.map(item => (
                    <Link key={item.label} href={item.href}
                        className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                        <item.icon className="nav-icon" size={17} />
                        <span>{item.label}</span>
                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-footer-card">
                    <p>Clinical-grade AI diagnostics</p>
                    <button className="upgrade-btn"><Zap size={12} /> Upgrade to Pro</button>
                </div>
            </div>
        </aside>
    );
}
