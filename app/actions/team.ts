"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// 1. Generate a new Store Code for a specific role
export async function generateStoreJoinCode(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const role = formData.get("role") as string
    if (!role) {
        return { error: "Role is required" }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: "Not authenticated" }
    }

    const { data: storeCode, error } = await supabase.rpc("generate_store_code", { p_role: role })

    if (error) {
        console.error("Error generating store code:", JSON.stringify(error, null, 2))
        const errorMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error) || "")
        return { error: errorMsg || "Failed to generate store code" }
    }

    revalidatePath("/settings")
    return { success: true, storeCode }
}

// 2. Fetch all active Store Codes for the logged-in owner
export async function getActiveStoreCodes() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { storeCodes: [] }

    const { data, error } = await supabase
        .from("store_codes")
        .select("id, code, role, created_at")
        .eq("store_id", user.id)
        .order("created_at", { ascending: false })

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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { error } = await supabase.rpc("revoke_store_code", { p_code_id: codeId })

    if (error) {
        return { error: "Failed to revoke store code" }
    }

    revalidatePath("/settings")
    return { success: true }
}

// 4. Employee joins via Store Code
export async function joinStoreWithCode(formData: FormData) {
    console.log("joinStoreWithCode ACTION START");
    try {
        // In Next.js 15, pass the Promise returned by cookies() directly instead of awaiting it here, 
        // as the createServerClient in lib/supabase/server.ts is designed to await it internally
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const storeCode = formData.get("storeCode") as string

        if (!storeCode || storeCode.trim().length === 0) {
            return { error: "Store code is required" }
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { error: "You must be logged in to join a team." }
        }

        console.log(`Attempting to join store with code: ${storeCode} for user: ${user.id}`);

        const { error: joinError } = await supabase
            .rpc("join_store_by_code", { p_code: storeCode })

        if (joinError) {
            console.error("Error joining store (Supabase Error):", JSON.stringify(joinError, null, 2))
            const errorMsg = typeof joinError === 'string' ? joinError : (joinError.message || JSON.stringify(joinError) || "")
            return { error: errorMsg || "Failed to join store. Invalid code." }
        }

        console.log("Join successful! Revalidating paths...");
        revalidatePath("/", "layout");
        return { success: true }
    } catch (e: any) {
        console.error("Uncaught exception in joinStoreWithCode:", e);
        return { error: e.message || "An unexpected error occurred while joining." }
    }
}


// --- Keep these existing active team management actions ---

export async function updateTeamMemberRole(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const memberId = formData.get("memberId") as string
    const role = formData.get("role") as string

    if (!memberId || !role) {
        return { error: "Member ID and role are required" }
    }

    // Owner updating employee record
    const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", memberId)

    if (error) {
        console.error("Error updating role:", error)
        return { error: error.message || "Failed to update role" }
    }

    revalidatePath("/settings")
    return { success: true }
}

export async function removeTeamMember(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const memberId = formData.get("memberId") as string

    if (!memberId) {
        return { error: "Member ID is required" }
    }

    // Reset the user's owner_id and role
    const { error } = await supabase
        .rpc("remove_team_member", { member_id: memberId })

    if (error) {
        console.error("Error removing member:", JSON.stringify(error, null, 2))
        return { error: error.message || "Failed to remove member" }
    }

    revalidatePath("/settings")
    return { success: true }
}
