// src/admin/types/user.ts

export interface User {
    id: number;
    username: string;
    email: string;
    fullName: string;
    phone: string;
    enabled: boolean;
    accountNonLocked: boolean;
    roles: string[];
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
}

export interface UserStats {
    total: number;
    active: number;
    locked: number;
    admin: number;
    user: number;
    newThisMonth: number;
}

export interface Role {
    name: string;
    label: string;
    color: string;
    description: string;
}