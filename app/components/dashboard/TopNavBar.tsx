import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/utils/firebase/client";
import { signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import {
    User,
    LogOut,
    Settings,
    Home,
    History,
    CalendarDays,
    Menu,
    X,
    ChevronDown,
} from "lucide-react";

type BasicUser = {
    displayName: string;
    email: string;
    photoURL: string | null;
};

export default function TopNavBar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<BasicUser | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (!firebaseUser) {
                setUser(null);
                return;
            }

            setUser({
                displayName: firebaseUser.displayName || "User",
                email: firebaseUser.email || "",
                photoURL: firebaseUser.photoURL,
            });
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const navLinks = [
        { name: "Dashboard", href: "/dashboard", icon: <Home size={18} /> },
        { name: "Calendar", href: "/calendar", icon: <CalendarDays size={18} /> },
        { name: "Timeline", href: "/timeline", icon: <History size={18} /> },
        { name: "Settings", href: "/settings", icon: <Settings size={18} /> },
    ];

    const userInitial = user?.displayName?.[0] || user?.email?.[0] || "U";

    return (
        <nav
            aria-label="Main Navigation"
            className="bg-white/80 backdrop-blur-md sticky top-0 w-full z-50 border-b border-black/5 shadow-sm"
        >
            <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#1a1c1b] no-underline group"
                >
                    <div className="w-8 h-8 bg-brand-rose rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                        <Heart size={18} fill="currentColor" />
                    </div>
                    <span>
                        Heart<span className="text-brand-rose">2</span>Heart
                    </span>
                </Link>

                <div className="hidden md:flex items-center space-x-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${pathname === link.href
                                    ? "bg-brand-rose/10 text-brand-rose"
                                    : "text-[#78716c] hover:bg-black/5 hover:text-[#1a1c1b]"
                                }`}
                        >
                            {link.icon}
                            {link.name}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-black/5 transition-colors focus:outline-none"
                        >
                            <div className="w-8 h-8 rounded-full bg-brand-rose/10 flex items-center justify-center border border-brand-rose/20 text-brand-rose font-bold text-sm overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    userInitial.toUpperCase()
                                )}
                            </div>
                            <ChevronDown
                                size={14}
                                className={`text-[#78716c] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                <div className="absolute right-0 top-11 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-black/5 py-2 z-20 animate-in fade-in zoom-in duration-200">
                                    <div className="px-4 py-3 border-b border-black/5 mb-2">
                                        <p className="text-sm font-semibold text-[#1a1c1b] truncate">{user?.displayName || "User"}</p>
                                        <p className="text-xs text-[#78716c] truncate">{user?.email || ""}</p>
                                    </div>

                                    <Link
                                        href="/settings"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4a4c4b] hover:bg-black/5 transition-colors"
                                    >
                                        <User size={16} />
                                        Profile Settings
                                    </Link>

                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#ef4444] hover:bg-red-50 transition-colors mt-1"
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        className="md:hidden p-2 rounded-xl hover:bg-black/5 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-black/5 bg-white animate-in slide-in-from-top duration-300">
                    <div className="p-4 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${pathname === link.href
                                        ? "bg-brand-rose/10 text-brand-rose"
                                        : "text-[#4a4c4b] hover:bg-black/5"
                                    }`}
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-2 mt-2 border-t border-black/5">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

function Heart({
    size = 18,
    fill = "none",
    className = "",
}: {
    size?: number;
    fill?: string;
    className?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={fill}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
    );
}
