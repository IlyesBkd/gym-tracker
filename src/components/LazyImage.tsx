import { useState, useEffect } from 'react'

interface LazyBackgroundProps {
  imageUrl: string
  fallbackColor?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function LazyBackground({
  imageUrl,
  fallbackColor = '#232A25',
  children,
  className = '',
  style = {},
}: LazyBackgroundProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Create an image element to preload
    const img = new Image()

    img.onload = () => {
      setLoaded(true)
      setError(false)
    }

    img.onerror = () => {
      setError(true)
      setLoaded(false)
    }

    // Start loading
    img.src = imageUrl

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [imageUrl])

  return (
    <div
      className={className}
      style={{
        ...style,
        backgroundImage: loaded && !error ? `url('${imageUrl}')` : 'none',
        backgroundColor: error || !loaded ? fallbackColor : 'transparent',
        transition: 'background-image 0.3s ease-in-out',
      }}
    >
      {children}
    </div>
  )
}

interface LazyImageProps {
  src: string
  alt: string
  fallbackSrc?: string
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  fallbackSrc,
  className = '',
  style = {},
  onLoad,
  onError,
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setHasError(false)

    const img = new Image()

    img.onload = () => {
      setImageSrc(src)
      setIsLoading(false)
      setHasError(false)
      onLoad?.()
    }

    img.onerror = () => {
      setHasError(true)
      setIsLoading(false)
      if (fallbackSrc) {
        setImageSrc(fallbackSrc)
      }
      onError?.()
    }

    img.src = src

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, fallbackSrc, onLoad, onError])

  if (isLoading) {
    return (
      <div
        className={`${className} animate-pulse bg-surface-light`}
        style={style}
      />
    )
  }

  if (hasError && !fallbackSrc) {
    return (
      <div
        className={`${className} bg-surface-light flex items-center justify-center`}
        style={style}
      >
        <span className="text-muted text-xs">📷</span>
      </div>
    )
  }

  return (
    <img
      src={imageSrc || fallbackSrc}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
    />
  )
}
