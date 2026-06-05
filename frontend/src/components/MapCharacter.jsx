import idleImg from '../assets/map/harcerz-stojacy1.png'
import walkGif from '../assets/map/chodzacy-harcerz.gif'

const SIZE = 48

/**
 * MapCharacter — ludzik na mapie (idle PNG, walk GIF).
 */
export default function MapCharacter({ x, y, walking = false }) {
  return (
    <image
      href={walking ? walkGif : idleImg}
      x={x - SIZE / 2}
      y={y - SIZE}
      width={SIZE}
      height={SIZE}
      style={{ pointerEvents: 'none' }}
    />
  )
}
