export const useAdminAuth = () => {
  const store = useAdminSessionStore()

  return {
    account: computed(() => store.account),
    loading: computed(() => store.loading),
    loaded: computed(() => store.loaded),
    isActive: computed(() => store.isActive),
    isPending: computed(() => !store.account || store.account.status === 'pending'),
    isSuperAdmin: computed(() => store.isSuperAdmin),
    ensureAccount: () => store.ensureAccount(),
    refresh: () => store.fetch(),
  }
}
