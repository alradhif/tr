type AssetIconProps = {
  src: string
  size?: number
  className?: string
  alt?: string
}

export function AssetIcon({ src, size = 16, className = 'asset-icon', alt = '' }: AssetIconProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      aria-hidden={alt ? undefined : true}
    />
  )
}
