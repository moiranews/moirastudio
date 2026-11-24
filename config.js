// Supabase connection for Moira:Studio: the ONE place the project URL and key live.
// Every page loads this before its own scripts. Switching project (e.g. to staging) is a
// change to this file only.
//
// supabaseAnonKey holds the project's publishable key (sb_publishable_…), the successor to
// the anon key. It is safe in public client code only because RLS enforces access on every
// table. The secret key (sb_secret_…) and the service_role key must never appear here or
// anywhere in the repo.
window.MOIRA_CONFIG = Object.freeze({
  supabaseUrl: 'https://iewcpbbzmhpxzxuvrxcc.supabase.co',
  supabaseAnonKey: 'sb_publishable_jsBn9C7SZ6KGOA1ZJ1TSIg_igchJgQr',
});
