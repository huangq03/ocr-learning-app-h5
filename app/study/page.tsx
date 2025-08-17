// app/study/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudyInterface from "@/components/study-interface";
import { User } from "@supabase/supabase-js";

async function getDueItems(supabase: any, user: User) {
    const today = new Date().toISOString().split("T")[0];

    const { data: dueItems, error } = await supabase
        .from("spaced_repetition_schedule")
        .select(`
            *,
            text_items:text_item_id (*)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .lte("next_review_date", today);

    if (error) {
        console.error("Error fetching due items:", error);
        return [];
    }

    return dueItems;
}

export default async function StudyPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const dueItems = await getDueItems(supabase, user);

    return <StudyInterface initialItems={dueItems || []} user={user} />;
}
