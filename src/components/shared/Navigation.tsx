'use client'

import { useRef } from 'react'
import Link from '@/components/shared/Link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { useIsInsideMobileNavigation } from '@/components/shared/MobileNavigation'
import { useSectionStore } from '@/components/shared/SectionProvider'
import { Tag } from '@/components/shared/Tag'
import { remToPx } from '@/lib/remToPx'
import { NavGroup, navigation } from '@/navigation'

function useInitialValue<T>(value: T, condition = true) {
  let initialValue = useRef(value).current
  return condition ? initialValue : value
}

function NavLink({
  href,
  children,
  tag,
  active = false,
  isAnchorLink = false,
}: {
  href: string
  children: React.ReactNode
  tag?: string
  active?: boolean
  isAnchorLink?: boolean
}) {
  const pathname = usePathname()
  // Check both exact matches and parent route matches
  const isActive = active || pathname.startsWith(href)

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={clsx(
        'flex justify-between gap-2 py-1 pr-3 text-sm transition',
        isAnchorLink ? 'pl-7' : 'pl-4',
        isActive
          ? 'text-green-700 dark:text-green-500'
          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
      )}
    >
      <span className="truncate">{children}</span>
      {tag && (
        <Tag variant="small" color="zinc">
          {tag}
        </Tag>
      )}
    </Link>
  )
}

function ActivePageMarker({
  group,
  pathname,
  level = 0,
}: {
  group: NavGroup
  pathname: string
  level: number
}) {
  let itemHeight = remToPx(2)
  let offset = remToPx(0.25)
  let activePageIndex = findActiveIndex(group, pathname)
  let top = offset + activePageIndex * itemHeight + level * itemHeight

  // Show marker for both exact matches and parent routes
  const shouldShowMarker =
    activePageIndex !== -1 ||
    group.links?.some(
      (link) => 'href' in link && pathname.startsWith(link.href ?? ''),
    )

  if (!shouldShowMarker) return null

  return (
    <motion.div
      layout
      className="absolute left-0 h-6 w-px bg-emerald-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.2 } }}
      exit={{ opacity: 0 }}
      style={{ top }}
    />
  )
}

function findActiveIndex(group: NavGroup, pathname: string): number {
  let index = 0
  for (const item of group?.links ?? []) {
    if ('links' in item) {
      // Check nested routes first
      const nestedIndex = findActiveIndex(item, pathname)
      // Only return parent index if no nested match is found
      if (nestedIndex !== -1) {
        // Return the nested index to highlight the actual active item
        return index + nestedIndex
      }
    } else {
      // Check both exact match and if this is the current page's parent route
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        return index
      }
    }
    index++
  }
  return -1
}

function NavigationGroup({
  group,
  className,
  level = 0,
}: {
  group: NavGroup
  className?: string
  level?: number
}) {
  let isInsideMobileNavigation = useIsInsideMobileNavigation()
  let [pathname, sections] = useInitialValue(
    [usePathname(), useSectionStore((s) => s.sections)],
    isInsideMobileNavigation,
  )

  return (
    <div className={clsx('relative mt-6', className)}>
      <motion.h2
        layout="position"
        className={clsx(
          'text-xs text-zinc-900 dark:text-white',
          level > 0 && 'ml-4',
        )}
      >
        {group.href ? (
          <Link href={group.href}>{group.title}</Link>
        ) : (
          group.title
        )}
      </motion.h2>
      <div className={clsx('relative mt-3')}>
        {level === 0 && (
          <motion.div
            layout
            className="absolute inset-y-0 left-0 w-px bg-zinc-900/10 dark:bg-white/5"
          />
        )}
        <AnimatePresence initial={false}>
          {level === 0 && (
            <ActivePageMarker group={group} pathname={pathname} level={level} />
          )}
        </AnimatePresence>
        <ul role="list" className="border-l border-transparent pl-2">
          {group.links?.map((link, index) => {
            if ('links' in link) {
              return (
                <li key={index}>
                  <NavigationGroup
                    group={link}
                    level={level + 1}
                    className="mt-1"
                  />
                </li>
              )
            }

            return (
              <motion.li key={index} layout="position" className="relative">
                <NavLink href={link.href ?? ''} active={link.href === pathname}>
                  {link.title}
                </NavLink>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export function Navigation(props: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav {...props}>
      <ul role="list">
        {navigation.map((group, groupIndex) => (
          <li key={group.title}>
            <NavigationGroup
              group={group}
              className={groupIndex === 0 ? 'md:mt-0' : ''}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}
