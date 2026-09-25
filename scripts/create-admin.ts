/**
 * Create (or promote) a CannaDry staff account.
 * Usage: npm run create-admin -- <email> <password> "<Full name>"
 */
import { createClient } from "@supabase/supabase-js";

async function main() {
  const [email, password, fullName = "CannaDry Admin"] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npm run create-admin -- <email> <password> "<Full name>"');
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName, email, is_admin: true, company_id: null });
  if (error) throw error;
  console.log(`Admin ready: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
