import idleGif from '../assets/map/ludzik-idle.png'

const SIZE = 64

/**
 * MapCharacter — ludzik na mapie.
 */
export default function MapCharacter({ x, y }) {
  return (
    <image
      href={idleGif}
      x={x - SIZE / 2}
      y={y - SIZE}
      width={SIZE}
      height={SIZE}
      style={{ pointerEvents: 'none' }}
    />
  )
}
