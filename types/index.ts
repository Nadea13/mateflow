export interface User {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
}

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string
    attachments?: string[]
}

export interface Product {
    id: string
    user_id: string
    name: string
    price: number
    stock: number
    image_url?: string
    created_at?: string
    updated_at?: string
}

export interface Customer {
    id: string
    user_id: string
    name: string
    email?: string
    phone?: string;
    address?: string;
    line_id?: string;
    created_at: string
    updated_at: string
}

export interface BillItem {
    id: string
    bill_id: string
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
}

export interface BillAdjustment {
    label: string
    type: 'percent' | 'fixed'
    value: number
}

export interface Bill {
    id: string
    user_id: string
    customer_id: string
    total_amount: number
    status: 'draft' | 'paid' | 'cancelled'
    note?: string
    adjustments?: BillAdjustment[]
    payment_terms?: number
    validity_days?: number
    created_at: string
    // Joined fields
    customer_name?: string
    items?: BillItem[]
}

export interface Profile {
    id: string
    store_name?: string
    avatar_url?: string
    updated_at: string
}

export interface Expense {
    id: string
    user_id: string
    title: string
    amount: number
    category: string
    description?: string
    date: string
    receipt_url?: string
    created_at: string
}
