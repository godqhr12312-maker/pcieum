import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getFavoriteIds, getProfile, isAdmin } from "@/lib/store";
import { handleApi, json } from "@/app/api/_shared";
import { MEMBER_FEATURES_ENABLED } from "@/lib/member-features";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleApi(async () => {
    if (!MEMBER_FEATURES_ENABLED) return json({ user: null, profile: null, isAdmin: false, favoriteIds: [] });
    const user = await getChatGPTUser();
    if (!user) return json({ user: null, profile: null, isAdmin: false, favoriteIds: [] });
    const [profile, favoriteIds] = await Promise.all([getProfile(user.userId), getFavoriteIds(user.userId)]);
    return json({ user, profile, isAdmin: isAdmin(user.userId), favoriteIds });
  });
}
