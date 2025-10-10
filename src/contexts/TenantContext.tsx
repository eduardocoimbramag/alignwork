import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

type TenantContextType = {
    tenantId: string
    setTenantId: (tenantId: string) => void
}

const DEFAULT_TENANT_ID = 'default-tenant'
const STORAGE_KEY = 'alignwork:tenantId'

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
    const [tenantId, setTenantIdState] = useState<string>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved || DEFAULT_TENANT_ID
        } catch {
            return DEFAULT_TENANT_ID
        }
    })

    const setTenantId = (next: string) => {
        setTenantIdState(next || DEFAULT_TENANT_ID)
    }

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, tenantId)
        } catch {
            // noop
        }
    }, [tenantId])

    const value = useMemo(() => ({ tenantId, setTenantId }), [tenantId])

    return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant(): TenantContextType {
    const ctx = useContext(TenantContext)
    if (!ctx) throw new Error('useTenant must be used within a TenantProvider')
    return ctx
}


