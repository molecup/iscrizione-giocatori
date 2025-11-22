// javascript
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Header.module.css";

export default function Header() {
    const [dark, setDark] = useState(false);
    const light = !dark;

    useEffect(() => {
        const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
        const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialDark = saved ? saved === "dark" : prefersDark;
        setDark(initialDark);
    }, []);

    useEffect(() => {
        if (typeof document !== "undefined") {
            document.body.classList.toggle("dark", dark);
            localStorage.setItem("theme", dark ? "dark" : "light");
        }
    }, [dark]);

    const logoStyle = {
        width: 32,
        height: "auto",
        filter: light ? "invert(1) brightness(2) contrast(1)" : "none",
        transition: "filter .18s ease"
    };

    return (
        <header className={styles.header}>
            <div className={styles.inner + " container"}>
                <Link href="/login" className={styles.brand}>
                    <img src="/logoLCSw.png" alt="Logo" style={logoStyle} />
                    <span>LCS</span>
                </Link>
                <nav className={styles.nav}>
                    <Link href="/login" className={styles.link}>Login</Link>
                    <Link href="/dashboard" className={styles.link}>Dashboard</Link>
                    <Link href="/privacy" className={styles.link}>Privacy</Link>
                    <button className="button secondary" onClick={() => setDark(v => !v)} aria-pressed={dark}>
                        {dark ? "Light" : "Dark"} mode
                    </button>
                </nav>
            </div>
        </header>
    );
}
