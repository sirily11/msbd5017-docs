import NextLink from 'next/link'

const Link = (props: React.ComponentPropsWithoutRef<typeof NextLink>) => {
  return <NextLink prefetch={false} {...props} />
}

export default Link
