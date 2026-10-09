"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserSession } from '../../hooks/useUserSession';
import { useAuth } from '@/contexts/AuthContext';
import { PortalClientesButton } from '@/components/portal-clientes/PortalClientesButton';


interface UserMenuProps {
    isMobile?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ isMobile = false }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const router = useRouter();
    const { user, isLoading, isAuthenticated, sessionState } = useUserSession();
    const { logout, refreshSessionState } = useAuth();

    const iconWrap = isMobile ? 'w-6 h-6' : 'w-8 h-8';
    const iconSize = isMobile ? 'w-3 h-3' : 'w-4 h-4';

    if (isLoading) {
        return (
            <div className={`${iconWrap} rounded-full bg-neutral-200 flex items-center justify-center animate-pulse`}>
                <User className={`${iconSize} text-neutral-400`} />
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                onMouseEnter={() => setShowUserMenu(true)}
                className={`flex items-center gap-2 ${isMobile ? 'p-1' : 'p-1.5'} rounded-lg hover:bg-neutral-100 transition-colors group`}
                aria-label={isAuthenticated ? "Menú de usuario" : "Iniciar sesión"}
            >
                <div className={`${iconWrap} rounded-full bg-neutral-200 flex items-center justify-center group-hover:bg-neutral-300 transition-colors`}>
                    <User className={`${iconSize} text-neutral-700`} />
                </div>
                {isAuthenticated ? (
                    <span className="hidden md:block text-sm font-medium text-neutral-700 max-w-[120px] truncate">
                        {user?.name || user?.email || 'Usuario'}
                    </span>
                ) : (
                    <span className="hidden md:block text-sm font-medium text-neutral-700">
                        Iniciar sesión
                    </span>
                )}
            </button>

            <AnimatePresence>
                {showUserMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 z-40 md:hidden"
                            onClick={() => setShowUserMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onMouseLeave={() => setShowUserMenu(false)}
                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-50"
                        >
                            <div className="p-2">
                                {isAuthenticated ? (
                                    <>
                                        <div className="px-3 py-2 border-b border-neutral-200">
                                            <p className="text-sm font-medium text-neutral-900">
                                                {user?.name || 'Usuario'}
                                            </p>
                                            <p className="text-xs text-neutral-500 truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors block"
                                            onClick={async () => {
                                                setShowUserMenu(false);
                                                await refreshSessionState();
                                                router.push('/perfil');
                                            }}
                                        >
                                            Mi perfil
                                        </button>
                                        {sessionState?.role === 'USER' && <PortalClientesButton appearance="menu" />}
                                        <button
                                            type="button"
                                            className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors block"
                                            onClick={async () => {
                                                setShowUserMenu(false);
                                                await logout();
                                                // Full page nav para que la cookie ya esté borrada y no haya bucle con el middleware
                                                window.location.href = '/auth/login';
                                            }}
                                        >
                                            Cerrar Sesión
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/auth/login"
                                        className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors block"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        Iniciar Sesión
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

