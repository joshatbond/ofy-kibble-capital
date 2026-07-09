import { useEffect, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { cn } from '~/lib/class-name-merge'

export function UserAvatar(props: {
  src: string | undefined
  initials: string
  size?: 'default' | 'sm' | 'lg'
  className?: string
  fallbackClassName?: string
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage =
    props.src !== undefined && props.src.length > 0 && !imageFailed

  useEffect(() => {
    setImageFailed(false)
  }, [props.src])

  return (
    <Avatar size={props.size ?? 'lg'} className={props.className}>
      {showImage ? (
        <AvatarImage
          key={props.src}
          src={props.src}
          alt=""
          referrerPolicy="no-referrer"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : null}

      <AvatarFallback className={cn(props.fallbackClassName)}>
        {props.initials}
      </AvatarFallback>
    </Avatar>
  )
}
