"use client";
import { Search, Bell, Sun, Moon, Languages } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

export default function Topbar() {
    const pathname = usePathname();
    const { dark, toggle } = useTheme();

    const names = {
        '/': 'Home',
        '/diagnose': 'AI Diagnosis',
        '/analytics': 'Model Analytics',
        '/history': 'History',
        '/reports': 'Reports',
        '/profile': 'Profile',
        '/settings': 'Settings',
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div className="topbar-breadcrumb">
                    <span>MedAI</span>
                    <span style={{ opacity: 0.3 }}>/</span>
                    <span className="active">{names[pathname] || 'Page'}</span>
                </div>
            </div>
            <div className="topbar-right">
                <button className="topbar-btn" onClick={() => {
                    const isHindi = document.cookie.includes('googtrans=/en/hi') || document.cookie.includes('googtrans=/auto/hi');
                    if (isHindi) {
                        document.cookie = 'googtrans=/en/en; path=/';
                        document.cookie = 'googtrans=/en/en; domain=' + window.location.hostname + '; path=/';
                    } else {
                        document.cookie = 'googtrans=/en/hi; path=/';
                        document.cookie = 'googtrans=/en/hi; domain=' + window.location.hostname + '; path=/';
                    }
                    window.location.reload();
                }} title="Translate to Hindi / हिंदी में अनुवाद करें">
                    <Languages size={16} />
                </button>
                <button className="topbar-btn"><Search size={16} /></button>
                <button className="topbar-btn" style={{ position: 'relative' }}>
                    <Bell size={16} />
                    <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, background: '#dc2626', borderRadius: '50%' }}></span>
                </button>
                <button className="topbar-btn" onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}>
                    {dark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <Link href="/profile">
                    <div className="user-avatar">K</div>
                </Link>
            </div>
        </header>
    );
}
