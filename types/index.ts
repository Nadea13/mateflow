export interface User {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
}

export interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    created_at: string
    attachments?: string[]
}

export interface ProductVariant {
    id: string
    product_id: string
    sku: string
    barcode?: string
    name: string // e.g. "Size L / Black"
    option_values?: Record<string, string> // e.g. { "Size": "L", "Color": "Black" }
    price?: number
    stock: number
    created_at?: string
    updated_at?: string
}

export interface Product {
    id: string
    store_id?: string
    user_id?: string
    name: string
    sku?: string
    barcode?: string
    price: number
    cost_price?: number
    stock: number
    image_url?: string
    created_at?: string
    updated_at?: string
    min_stock_level?: number
    supplier_id?: string
    // Joined / Extended fields
    supplier_name?: string
    variants?: ProductVariant[]
}

export interface Customer {
    id: string
    store_id?: string
    user_id?: string
    name: string
    email?: string
    phone?: string
    address?: string
    line_id?: string
    country?: string
    tax_id?: string
    created_at: string
    updated_at: string
}

export interface BillItem {
    id: string
    bill_id: string
    product_id: string
    product_name: string
    variant_id?: string
    variant_name?: string
    sku?: string
    quantity: number
    unit_price: number
    total_price: number
}

export interface BillAdjustment {
    label: string
    type: "percent" | "fixed"
    value: number
}

export interface Bill {
    id: string
    store_id?: string
    user_id?: string
    customer_id: string
    total_amount: number
    currency?: string
    status: "draft" | "paid" | "cancelled"
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
    email?: string
    owner_id?: string
    role?: "owner" | "admin" | "sales"
    default_currency?: string
    country?: string
    tax_rate?: number
    updated_at: string
}

export interface Store extends Profile {
    store_address?: string
    tax_id?: string
    store_phone?: string
    signature_url?: string
}

export interface Expense {
    id: string
    store_id?: string
    user_id?: string
    title: string
    amount: number
    currency?: string
    category: string
    description?: string
    date: string
    receipt_url?: string
    vendor_name?: string
    vendor_tax_id?: string
    wht_rate?: number
    wht_amount?: number
    input_vat?: number
    created_at: string
}

export interface Supplier {
    id: string
    store_id?: string
    user_id?: string
    name: string
    email?: string
    phone?: string
    address?: string
    country?: string
    created_at: string
    updated_at: string
}

export interface POItem {
    id: string
    po_id: string
    name: string
    sku?: string
    quantity: number
    unit_price: number
    total_price: number
    created_at: string
}

export interface PurchaseOrder {
    id: string
    store_id?: string
    user_id?: string
    supplier_id: string
    po_number: string
    total_amount: number
    currency?: string
    status: "draft" | "sent" | "received" | "cancelled"
    note?: string
    date: string
    created_at: string
    updated_at: string
    // Joined fields
    supplier_name?: string
    items?: POItem[]
}

export interface Branch {
    id: string
    store_id?: string
    user_id?: string
    name: string
    code?: string
    type: "warehouse" | "storefront" | "3pl" | "other"
    address?: string
    country?: string
    created_at: string
    updated_at: string
}

// Backward compatibility alias
export type Location = Branch;

export interface InventoryLevel {
    id: string
    store_id?: string
    product_id: string
    location_id: string
    variant_id?: string
    quantity: number
    updated_at: string
    // Joined fields
    location_name?: string
    location_code?: string
}
