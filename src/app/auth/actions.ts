"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
};

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Email hoặc mật khẩu không đúng.",
  "Email not confirmed": "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.",
  "User already registered": "Email này đã được đăng ký.",
  "Signup requires a valid password": "Mật khẩu không hợp lệ.",
  "Email rate limit exceeded": "Gửi email quá nhanh. Vui lòng đợi rồi thử lại.",
  "For security purposes, you can only request this after": "Vui lòng đợi trước khi thử lại.",
};

function viError(message: string): string {
  for (const [key, vi] of Object.entries(ERROR_MAP)) {
    if (message.includes(key)) return vi;
  }
  return message;
}

export async function signUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." };
  }

  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: viError(error.message) };
  }

  redirect("/app");
}

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: viError(error.message) };
  }

  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
