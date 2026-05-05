import "./globals.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { ThemeProvider } from "../components/ThemeProvider";
import Script from "next/script";
import ChatWidget from "../components/ChatWidget";

export const metadata = {
    title: "MedAI Diagnostics — AI-Powered Healthcare Intelligence",
    description: "Award-winning AI-driven healthcare diagnostic platform with explainable AI, symptom analysis, and transparent clinical reasoning.",
    keywords: "AI healthcare, diagnostics, explainable AI, XAI, symptom checker, medical AI",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider>
                    <div className="app-shell">
                        <Sidebar />
                        <div className="main-area">
                            <Topbar />
                            <div className="content-area">
                                {children}
                            </div>
                        </div>
                    </div>
                    <ChatWidget />
                </ThemeProvider>
                <div id="google_translate_element" style={{ display: 'none' }}></div>
                <Script id="google-translate-init" strategy="afterInteractive">
                    {`
                        function googleTranslateElementInit() {
                            new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: 'hi,en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE, autoDisplay: false}, 'google_translate_element');
                        }
                    `}
                </Script>
                <Script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
            </body>
        </html>
    );
}
