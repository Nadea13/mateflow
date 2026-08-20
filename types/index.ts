export type UserRole = "owner" | "admin" | "sales" | "accountant" | "stock_keeper";

export interface User {
    id: string;
    email: string;
    full_name?: string;
    created_at: string;
}

export type Branch = Location;

export interface Location {
    id: string;
    store_id?: string;
    user_id?: string;
    name: string;
    code: string;
    type: "warehouse" | "storefront" | "3pl" | "other";
    address?: string;
    country: string;
    created_at: string;
    updated_at: string;
}

export interface ProductVariant {
    id: string;
    product_id: string;
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
    cost_price?: number;
    stock: number;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    store_id?: string;
    user_id?: string;
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
    cost_price?: number;
    stock: number;
    image_url?: string;
    min_stock_level?: number;
    supplier_id?: string;
    supplier_name?: string;
    created_at: string;
    updated_at: string;
    variants?: ProductVariant[];
}

export interface Customer {
    id: string;
    store_id?: string;
    user_id?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    line_id?: string;
    country?: string;
    tax_id?: string;
    created_at: string;
    updated_at: string;
}

export interface BillItem {
    id: string;
    bill_id: string;
    product_id: string;
    product_name: string;
    variant_id?: string;
    variant_name?: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface BillAdjustment {
    label: string;
    type: "percent" | "fixed";
    value: number;
}

export interface Bill {
    id: string;
    store_id?: string;
    user_id?: string;
    customer_id: string;
    total_amount: number;
    currency?: string;
    status: "quotation" | "draft" | "paid" | "cancelled";
    note?: string;
    adjustments?: BillAdjustment[];
    payment_terms?: number;
    validity_days?: number;
    created_at: string;
    updated_at?: string;
    // Joined fields
    customer_name?: string;
    items?: BillItem[];
}

export interface Profile {
    id: string;
    store_name?: string;
    avatar_url?: string;
    email?: string;
    owner_id?: string;
    role?: "owner" | "admin" | "sales";
    default_currency?: string;
    country?: string;
    tax_rate?: number;
    updated_at: string;
}

export interface Store extends Profile {
    store_address?: string;
    tax_id?: string;
    signature_url?: string;
    store_phone?: string;
    etax_enabled?: boolean;
    etax_api_key?: string;
    etax_company_id?: string;
    stripe_publishable_key?: string;
    stripe_secret_key?: string;
    locations?: Location[];
}

export interface Supplier {
    id: string;
    store_id?: string;
    user_id?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    created_at: string;
    updated_at: string;
}

export type POItem = PurchaseOrderItem;

export interface PurchaseOrderItem {
    id: string;
    purchase_order_id?: string;
    product_id?: string;
    product_name?: string;
    name?: string;
    quantity: number;
    unit_cost?: number;
    unit_price?: number;
    total_cost?: number;
}

export interface PurchaseOrder {
    id: string;
    store_id?: string;
    user_id?: string;
    supplier_id: string;
    po_number: string;
    status: "draft" | "ordered" | "received" | "cancelled";
    total_amount: number;
    notes?: string;
    note?: string;
    date?: string;
    created_at: string;
    updated_at?: string;
    supplier_name?: string;
    items?: PurchaseOrderItem[];
}

export interface Expense {
    id: string;
    store_id?: string;
    user_id?: string;
    title: string;
    description?: string;
    amount: number;
    input_vat?: number;
    wht_rate?: number;
    wht_amount?: number;
    currency?: string;
    category: "cogs" | "shipping" | "rent" | "salary" | "marketing" | "utilities" | "tax" | "software" | "other";
    date: string;
    notes?: string;
    receipt_url?: string;
    supplier_id?: string;
    created_at: string;
    updated_at: string;
    supplier_name?: string;
}

export interface InventoryLevel {
    id: string;
    store_id?: string;
    user_id?: string;
    location_id: string;
    product_id: string;
    stock: number;
    min_stock_level?: number;
    created_at: string;
    updated_at: string;
    location?: Location;
    product?: Product;
}

export interface Subscription {
    id: string;
    user_id: string;
    tier: "free" | "starter" | "pro" | "enterprise";
    status: "active" | "canceled" | "past_due";
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    current_period_end?: string;
    created_at: string;
    updated_at: string;
}
