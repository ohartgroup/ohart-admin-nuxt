import { FetchError } from 'ofetch'

const PUBLIC_ROUTES = ['/login', '/confirm']

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  if (!user.value && PUBLIC_ROUTES.includes(to.path)) {
    return
  }
  if (!user.value) {
    return navigateTo('/login')
  }
  if (to.path === '/confirm') {
    return
  }

  const { account, isActive, loaded, refresh, ensureAccount } = useAdminAuth()

  if (!loaded.value) {
    await refresh()
  }

  // signup-check(pending row 최초 생성)는 서버 API 호출이 필요해 클라이언트에서만 수행한다.
  // SSR 단계에서 계정이 아직 없으면 일단 pending으로 취급하고, 클라이언트 hydration 시 생성 후 재확인한다.
  // 실패(허용되지 않은 도메인 등)하면 /pending을 반복 호출해봐야 계속 실패하므로 로그인 화면으로 되돌린다.
  if (import.meta.client && !account.value) {
    try {
      await ensureAccount()
    } catch (error) {
      const supabase = useSupabaseClient()
      await supabase.auth.signOut()
      const reason = error instanceof FetchError ? (error.data?.message ?? '가입이 거부되었습니다.') : '가입이 거부되었습니다.'
      return navigateTo(`/login?rejected=${encodeURIComponent(reason)}`)
    }
  }

  if (!isActive.value && to.path === '/pending') {
    return
  }
  if (!isActive.value) {
    return navigateTo('/pending')
  }
  if (to.path === '/login' || to.path === '/pending') {
    return navigateTo('/')
  }
})
