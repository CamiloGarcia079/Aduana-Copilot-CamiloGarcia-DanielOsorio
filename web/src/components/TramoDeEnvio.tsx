import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { GUADALAJARA, ubicarOrigen } from '../lib/rutas';

interface Props {
  origen: string;
}

/**
 * De dónde sale la mercancía y a dónde llega.
 *
 * Es contexto, no una ruta: no calcula escalas ni distancias de navegación, y
 * la línea es recta a propósito para que nadie la confunda con un trayecto
 * real. Está aquí porque ubicar el origen de un golpe de vista ayuda a entender
 * por qué un flete cuesta lo que cuesta.
 *
 * Si el origen no está en la lista de países conocidos, se muestra solo
 * Guadalajara en lugar de inventar un punto en el mapa.
 */
export function TramoDeEnvio({ origen }: Props) {
  const punto = ubicarOrigen(origen);

  const extremos: Array<[number, number]> = punto
    ? [
        [punto.lat, punto.lon],
        [GUADALAJARA.lat, GUADALAJARA.lon],
      ]
    : [[GUADALAJARA.lat, GUADALAJARA.lon]];

  return (
    <>
      <div className="tramo">
        <MapContainer
          center={[GUADALAJARA.lat, GUADALAJARA.lon]}
          zoom={3}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          attributionControl={false}
          keyboard={false}
        >
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Encuadrar extremos={extremos} />

          {punto && (
            <>
              <Polyline
                positions={extremos}
                pathOptions={{ color: '#1f5c45', weight: 1.5, dashArray: '5 5' }}
              />
              <CircleMarker
                center={[punto.lat, punto.lon]}
                radius={5}
                pathOptions={{ color: '#1f5c45', fillColor: '#fcfbf8', fillOpacity: 1, weight: 2 }}
              >
                <Tooltip permanent direction="top">
                  {punto.nombre}
                </Tooltip>
              </CircleMarker>
            </>
          )}

          <CircleMarker
            center={[GUADALAJARA.lat, GUADALAJARA.lon]}
            radius={6}
            pathOptions={{ color: '#1f5c45', fillColor: '#1f5c45', fillOpacity: 1, weight: 2 }}
          >
            <Tooltip permanent direction="bottom">
              {GUADALAJARA.nombre}
            </Tooltip>
          </CircleMarker>
        </MapContainer>
      </div>

      <p className="tramo__pie">
        <span>
          {punto
            ? `${punto.nombre} hacia ${GUADALAJARA.nombre}`
            : `Destino: ${GUADALAJARA.nombre}. El origen no está en el catálogo de puntos.`}
        </span>
        <span>Mapa de OpenStreetMap. La línea es referencia, no una ruta de embarque.</span>
      </p>
    </>
  );
}

/**
 * Encuadra el mapa para que entren los dos extremos.
 *
 * Hace falta porque el mapa se construye una sola vez con su centro y su zoom,
 * y el origen puede cambiar después sin que el mapa se dé cuenta.
 */
function Encuadrar({ extremos }: { extremos: Array<[number, number]> }) {
  const mapa = useMap();

  useEffect(() => {
    if (extremos.length < 2) {
      mapa.setView(extremos[0], 4);
      return;
    }

    mapa.fitBounds(extremos, { padding: [40, 40], animate: false });
  }, [mapa, extremos]);

  return null;
}
