"use server"

import createServer from "@/lib/supabase/server"
import { pick } from "lodash"
import { AuthError } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

/**
 * Access token을 추출
 * @param {NextRequest} request
 * @returns {string | null}
 */
export async function extractAccessToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader) return null
  const [type, token] = authHeader.split(" ")
  if (type !== "Bearer" || !token) return null
  return token
}

export async function singInWithEmailAndPassword(data: {
  email: string
  password: string
}) {
  const supabase = await createServer()

  const result = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  return result
}

export async function singUpWithEmailAndPassword(data: {
  email: string
  password: string
  nickname: string
}) {
  const supabase = await createServer()

  const { data: findUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .single()

  if (findUser?.id) {
    return {
      error: new AuthError("User already exists", 400, "user_already_exists"),
    }
  }

  const result = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        nickname: data.nickname,
        role: data.email === "dillon@sevenlinelabs.com" ? "admin" : "user",
      },
    },
  })

  if (!result.error && result.data.user) {
    await supabase.from("profiles").insert([
      {
        ...pick(result.data.user, ["id", "email"]),
        role: data.email === "dillon@sevenlinelabs.com" ? "admin" : "user",
        nickname: data.nickname,
        avatar_url: "",
      },
    ])
  }

  return result
}
