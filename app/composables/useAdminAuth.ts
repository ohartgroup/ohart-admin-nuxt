export const useAdminAuth = () => {
  const store = useAdminSessionStore()

  return {
    account: computed(() => store.account),
    loading: computed(() => store.loading),
    loaded: computed(() => store.loaded),
    isActive: computed(() => store.isActive),
    isPending: computed(() => !store.account || store.account.status === 'pending'),
    isSuperAdmin: computed(() => store.isSuperAdmin),
    isDepartmentHead: computed(() => store.isDepartmentHead),
    managedDepartmentIds: computed(() => store.managedDepartmentIds),
    ensureAccount: () => store.ensureAccount(),
    refresh: () => store.fetch(),
  }
}
