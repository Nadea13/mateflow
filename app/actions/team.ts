"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// 1. Generate a new Store Code for a specific role
export async function generateStoreJoinCode(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const role = (formData.get("role") as string) || "sales"

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: "Not authenticated" }
    }

    const activeStoreId = cookieStore.get("active_store_id")?.value

    let targetStoreId = activeStoreId
    if (!targetStoreId) {
        const { data: store } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true })
            .maybeSingle()
        targetStoreId = store?.id
    }

    if (!targetStoreId) {
        return { error: "Store not found" }
    }

    // Try RPC generate_store_code first
    const rpcRes = await supabase.rpc("generate_store_code", { 
        p_role: role,
        p_store_id: targetStoreId,
    })

    if (!rpcRes.error && rpcRes.data) {
        revalidatePath("/dashboard/settings")
        return { success: true, storeCode: rpcRes.data }
    }

    // Fallback: Direct table insert into store_codes
    const code = 'MF-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: newCode, error: insertError } = await supabase
        .from("store_codes")
        .insert({
            store_id: targetStoreId,
            code,
            role,
            created_by: user.id,
        })
        .select()
        .single()

    if (insertError) {
        console.error("Direct insert error store_codes:", insertError)
        return { error: insertError.message || "Failed to generate store code" }
    }

    revalidatePath("/dashboard/settings")
    return { success: true, storeCode: newCode }
}

// 2. Fetch all active Store Codes for the current active store
export async function getActiveStoreCodes(storeId?: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { storeCodes: [] }

    const targetStoreId = storeId || cookieStore.get("active_store_id")?.value

    let query = supabase.from("store_codes").select("*").order("created_at", { ascending: false })

    if (targetStoreId) {
        query = query.eq("store_id", targetStoreId)
    }

    const { data, error } = await query

    if (error) {
        return { storeCodes: [] }
    }

    return { storeCodes: data || [] }
}

// 3. Revoke a specific Store Code
export async function revokeStoreJoinCode(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const codeId = formData.get("codeId") as string
    if (!codeId) return { error: "Code ID required" }

    const { error } = await supabase
        .from("store_codes")
        .delete()
        .eq("id", codeId)

    if (error) {
        return { error: error.message || "Failed to revoke store code" }
    }

    revalidatePath("/dashboard/settings")
    return { success: true }
}

// 4. Employee joins via Store Code
export async function joinStoreWithCode(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const storeCode = formData.get("storeCode") as string
    if (!storeCode || storeCode.trim().length === 0) {
        return { error: "Store code is required" }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: "You must be logged in to join a team." }
    }

    // Try RPC join_store_by_code first
    const { data, error } = await supabase.rpc("join_store_by_code", { p_code: storeCode.trim() })

    if (!error) {
        revalidatePath("/dashboard", "layout")
        return { success: true }
    }

    // Fallback: Direct table query
    const { data: codeRecord } = await supabase
        .from("store_codes")
        .select("*")
        .ilike("code", storeCode.trim())
        .maybeSingle()

    if (!codeRecord) {
        return { error: "Invalid or expired store join code" }
    }

    await supabase.from("store_team_members").upsert({
        store_id: codeRecord.store_id,
        user_id: user.id,
        role: codeRecord.role,
        updated_at: new Date().toISOString(),
    }, { onConflict: "store_id, user_id" })

    revalidatePath("/dashboard", "layout")
    return { success: true }
}

// 5. Update team member role
export async function updateTeamMemberRole(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const memberId = formData.get("memberId") as string
    const role = formData.get("role") as string

    if (!memberId || !role) {
        return { error: "Member ID and role are required" }
    }

    const { error } = await supabase
        .from("store_team_members")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", memberId)

    if (error) {
        return { error: error.message || "Failed to update team member role" }
    }

    revalidatePath("/dashboard/settings")
    return { success: true }
}

// 6. Remove a member from the store team
export async function removeTeamMember(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const memberId = formData.get("memberId") as string
    if (!memberId) return { error: "Member ID required" }

    const { error } = await supabase
        .from("store_team_members")
        .delete()
        .eq("id", memberId)

    if (error) {
        return { error: error.message || "Failed to remove team member" }
    }

    revalidatePath("/dashboard/settings")
    return { success: true }
}
