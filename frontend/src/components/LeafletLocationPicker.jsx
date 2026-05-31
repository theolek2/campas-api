import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

const defaultIcon = L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })

function MapClickHandler({ onPin }) {
  useMapEvents({ click: e => onPin(e.latlng.lat, e.latlng.lng) })
  return null
}

function MapCenter({ lat, lng }) {
  const map = useMap()
  if (lat && lng) map.setView([lat, lng], map.getZoom())
  return null
}

export default function LeafletLocationPicker({ lat, lng, onCoordsChange, height = '280px' }) {
  const center = lat && lng ? [lat, lng] : [52.0, 19.0]
  const zoom = lat && lng ? 14 : 6

  return (
    <div style={{ height, width: '100%', borderRadius: 8, overflow: 'hidden' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
        <MapClickHandler onPin={onCoordsChange} />
        {lat && lng && <MapCenter lat={lat} lng={lng} />}
        {lat && lng && <Marker position={[lat, lng]} icon={defaultIcon} />}
      </MapContainer>
    </div>
  )
}
