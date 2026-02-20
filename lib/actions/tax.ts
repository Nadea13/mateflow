"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { BillAdjustment } from "@/types";

export interface TaxBracket {
    min: number;
    max: number;
    rate: number;
}

const THAI_PIT_BRACKETS: TaxBracket[] = [
    { min: 0, max: 150000, rate: 0 },
    { min: 150001, max: 300000, rate: 0.05 },
    { min: 300001, max: 500000, rate: 0.10 },
    { min: 500001, max: 750000, rate: 0.15 },
    { min: 750001, max: 1000000, rate: 0.20 },
    { min: 1000001, max: 2000000, rate: 0.25 },
    { min: 2000001, max: 5000000, rate: 0.30 },
    { min: 5000001, max: Infinity, rate: 0.35 },
];

const THAI_CIT_SME_BRACKETS: TaxBracket[] = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300001, max: 3000000, rate: 0.15 },
    { min: 3000001, max: Infinity, rate: 0.20 },
];

export interface TaxStats {
    year: number;
    totalIncome: number;
    totalExpenses: number;
    totalOutputVat: number;
}

export async function getYearlyTaxStats(year: number = new Date().getFullYear()): Promise<TaxStats> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year}-12-31T23:59:59.999Z`;

    // 1. Fetch Total Income (Sales) and Adjustments from BILLS
    const { data: bills, error: billsError } = await supabase
        .from("bills")
        .select("total_amount, adjustments")
        .neq("status", "cancelled")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

    if (billsError) {
        console.error("Error fetching bills for tax:", billsError);
        return { year, totalIncome: 0, totalExpenses: 0, totalOutputVat: 0 };
    }

    let totalIncome = 0;
    let totalOutputVat = 0;

    bills.forEach((bill: any) => {
        const amount = Number(bill.total_amount);
        totalIncome += amount;

        // Calculate VAT from adjustments
        if (bill.adjustments && Array.isArray(bill.adjustments)) {
            const adjustments = bill.adjustments as BillAdjustment[];
            const vatAdj = adjustments.find(a => a.label.includes("VAT") || a.label.includes("ภาษีมูลค่าเพิ่ม"));

            if (vatAdj) {
                if (vatAdj.type === 'percent') {
                    // Back-calculate VAT amount if it's a percentage added to subtotal
                    // Assuming total_amount includes VAT. 
                    // If VAT was added as (Subtotal * 0.07), then VAT amount is roughly (Total / 1.07) * 0.07 
                    // BUT createBill adds it to subtotal.
                    // Let's approximate: If logic was Subtotal + (Subtotal * 0.07) = Total
                    // Then VAT Part = Total - (Total / 1.07)
                    // Wait, createBill logic: total_amount += (subtotal * adj.value) / 100
                    // So Total = Subtotal * (1 + rate/100)
                    // Subtotal = Total / (1 + rate/100)
                    // VAT = Total - Subtotal
                    const rate = vatAdj.value;
                    const subtotal = amount / (1 + rate / 100);
                    totalOutputVat += (amount - subtotal);
                } else {
                    totalOutputVat += vatAdj.value;
                }
            }
        }
    });

    // 2. Fetch Total Expenses
    const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", startDate)
        .lte("date", endDate);

    if (expensesError) {
        console.error("Error fetching expenses for tax:", expensesError);
        return { year, totalIncome, totalExpenses: 0, totalOutputVat: 0 };
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
        year,
        totalIncome,
        totalExpenses,
        totalOutputVat
    };
}

export async function calculateTax(netProfit: number, deductions: number = 60000, type: 'personal' | 'corporate' = 'personal') {
    const brackets = type === 'corporate' ? THAI_CIT_SME_BRACKETS : THAI_PIT_BRACKETS;

    // For Corporate, deductions are usually expenses (already deducted). 
    // BUT we might use this field for other adjustments. 
    // For Personal, it's standard deductions.
    const taxableIncome = Math.max(0, netProfit - deductions);

    let totalTax = 0;
    const taxBreakdown = [];

    for (const bracket of brackets) {
        const lowerBound = bracket.min === 0 ? 0 : bracket.min - 1;

        if (taxableIncome <= lowerBound) {
            taxBreakdown.push({
                bracket: `${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? "MAX" : bracket.max.toLocaleString()}`,
                rate: `${(bracket.rate * 100).toFixed(0)}%`,
                amount_in_bracket: 0,
                tax: 0
            });
            continue;
        }

        let amountInBracket = 0;

        if (bracket.max === Infinity) {
            amountInBracket = taxableIncome - lowerBound;
        } else {
            // Amount is min(taxable, max) - lower.
            amountInBracket = Math.min(taxableIncome, bracket.max) - lowerBound;
        }

        amountInBracket = Math.max(0, amountInBracket);
        const taxForBracket = amountInBracket * bracket.rate;
        totalTax += taxForBracket;

        taxBreakdown.push({
            bracket: `${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? "MAX" : bracket.max.toLocaleString()}`,
            rate: `${(bracket.rate * 100).toFixed(0)}%`,
            amount_in_bracket: amountInBracket,
            tax: taxForBracket
        });
    }

    return {
        taxableIncome,
        totalTax,
        taxBreakdown
    };
}
