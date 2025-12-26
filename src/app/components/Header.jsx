// javascript
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Header.module.css";
import {logout} from "@app/lib/auth"
import { useRouter } from "next/navigation";

export default function Header({ user_permissions }) {
    const [dark, setDark] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const light = !dark;
    const router = useRouter();

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

    useEffect(() => {
        const media = typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)") : null;
        const lock = menuOpen && media?.matches;
        if (typeof document !== "undefined") {
            document.getElementById("container").style.display = lock ? "none" : "block";
        }
        return () => {
            if (typeof document !== "undefined") {
                document.getElementById("container").display = "block";
            }
        };
    }, [menuOpen]);

    const logoStyle = {
        width: 32,
        height: "auto",
        filter: light ? "invert(1) brightness(2) contrast(1)" : "none",
        transition: "filter .18s ease"
    };

    const handle_logout = async (e) => {
        e.preventDefault();
        await logout();
        router.push("/login");
    }

    const handleNavClick = () => setMenuOpen(false);

    return (
        <header className={styles.header}>
            <div className={styles.inner + " container"}>
                <Link href="/login" className={styles.brand}>
                    <img src="/logoLCSw.png" alt="Logo" style={logoStyle} />
                    <span>LCS</span>
                </Link>
                <button
                    className={styles.menuToggle}
                    aria-expanded={menuOpen}
                    aria-controls="primary-nav"
                    aria-label="Apri il menu"
                    onClick={() => setMenuOpen(v => !v)}
                >
                    <span />
                    <span />
                    <span />
                </button>
                <nav id="primary-nav" className={styles.nav + (menuOpen ? " " + styles.navOpen : "")}>
                    {!user_permissions?.isAuth && <Link href="/login" className={styles.link} onClick={handleNavClick}>Login</Link>}
                    {user_permissions?.isPlayer && <Link href="/profile" className={styles.link} onClick={handleNavClick}>Profile</Link>}
                    {user_permissions?.isManager && <Link href="/dashboard" className={styles.link} onClick={handleNavClick}>Dashboard</Link>}
                    {user_permissions?.isManager && false && <Link href="/staff-jerseys" className={styles.link} onClick={handleNavClick}>Maglie Staff</Link>}
                    <Link href="/privacy" className={styles.link} onClick={handleNavClick}>Privacy</Link>
                    {user_permissions?.isAuth && <Link href="/login" className={styles.link} onClick={(e) => { handle_logout(e); handleNavClick(); }}>Log Out</Link>}

                    <button className="button secondary" onClick={() => setDark(v => !v)} aria-pressed={dark}>
                        {dark ? "Light" : "Dark"} mode
                    </button>
                </nav>
            </div>
        </header>
    );
}
