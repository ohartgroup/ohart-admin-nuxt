export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      neutral: 'stone',
    },
    button: {
      defaultVariants: { size: 'lg' },
      compoundVariants: [
        { color: 'primary', variant: 'solid', class: 'text-neutral-900 dark:text-neutral-900' },
      ],
    },
    input: { defaultVariants: { size: 'lg' } },
    select: { defaultVariants: { size: 'lg' } },
    selectMenu: { defaultVariants: { size: 'lg' } },
    textarea: { defaultVariants: { size: 'lg' } },
    checkbox: { defaultVariants: { size: 'lg' } },
    badge: { defaultVariants: { size: 'lg' } },
  },
})
