import { requireData, supabase } from '../db/supabase.js';

export async function findUserByEmail(email) {
  const result = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  return requireData(result, 'Failed to fetch user by email');
}

export async function createUser({ name, email, passwordHash }) {
  const result = await supabase
    .from('users')
    .insert({
      name,
      email,
      password_hash: passwordHash,
    })
    .select('id, name, email, role, created_at')
    .single();

  return requireData(result, 'Failed to create user');
}

export async function findUserById(id) {
  const result = await supabase
    .from('users')
    .select('id, name, email, role, streak_count, last_active_date, created_at')
    .eq('id', id)
    .maybeSingle();

  return requireData(result, 'Failed to fetch user by id');
}

export async function updateUserStreak(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const userResult = await supabase
    .from('users')
    .select('streak_count, last_active_date')
    .eq('id', userId)
    .maybeSingle();

  const user = requireData(userResult, 'Failed to fetch user streak');
  if (!user) {
    return;
  }

  let streakCount = user.streak_count || 0;
  const lastActiveDate = user.last_active_date || null;

  if (lastActiveDate === today) {
    return;
  }

  if (lastActiveDate === yesterday) {
    streakCount += 1;
  } else {
    streakCount = 1;
  }

  const updateResult = await supabase
    .from('users')
    .update({ streak_count: streakCount, last_active_date: today })
    .eq('id', userId);

  requireData(updateResult, 'Failed to update user streak');
}
