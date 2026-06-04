// Ola Maps TypeScript definitions
export interface OlaMapOptions {
  center: [number, number]; // [lng, lat]
  zoom: number;
  style?: string;
  apiKey?: string;
}

export interface OlaMarkerOptions {
  lngLat: [number, number];
  element?: HTMLElement;
  anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  offset?: [number, number];
  draggable?: boolean;
}

export interface OlaPopupOptions {
  closeButton?: boolean;
  closeOnClick?: boolean;
  closeOnMove?: boolean;
  focusAfterOpen?: boolean;
  anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  offset?: [number, number];
  className?: string;
  maxWidth?: string;
}

export declare class OlaMap {
  constructor(options: { container: string | HTMLElement } & OlaMapOptions);
  
  setCenter(center: [number, number]): this;
  getCenter(): [number, number];
  setZoom(zoom: number): this;
  getZoom(): number;
  fitBounds(bounds: [[number, number], [number, number]], options?: any): this;
  
  on(type: string, listener: (ev: any) => void): this;
  off(type: string, listener: (ev: any) => void): this;
  
  addControl(control: any, position?: string): this;
  removeControl(control: any): this;
  
  remove(): void;
  resize(): this;
  
  addSource(id: string, source: any): this;
  removeSource(id: string): this;
  addLayer(layer: any, beforeId?: string): this;
  removeLayer(id: string): this;
  
  flyTo(options: { center: [number, number]; zoom?: number; speed?: number; curve?: number }): this;
  easeTo(options: { center?: [number, number]; zoom?: number; duration?: number }): this;
}

export declare class OlaMarker {
  constructor(options?: OlaMarkerOptions);
  
  addTo(map: OlaMap): this;
  remove(): this;
  getLngLat(): [number, number];
  setLngLat(lngLat: [number, number]): this;
  setPopup(popup: OlaPopup): this;
  getPopup(): OlaPopup | undefined;
  togglePopup(): this;
  
  getElement(): HTMLElement;
  setDraggable(draggable: boolean): this;
  isDraggable(): boolean;
  
  on(type: string, listener: (ev: any) => void): this;
  off(type: string, listener: (ev: any) => void): this;
}

export declare class OlaPopup {
  constructor(options?: OlaPopupOptions);
  
  addTo(map: OlaMap): this;
  remove(): this;
  isOpen(): boolean;
  getLngLat(): [number, number];
  setLngLat(lngLat: [number, number]): this;
  setHTML(html: string): this;
  setText(text: string): this;
  setDOMContent(htmlNode: Node): this;
  
  on(type: string, listener: (ev: any) => void): this;
  off(type: string, listener: (ev: any) => void): this;
}

export declare namespace olamaps {
  export { OlaMap as Map };
  export { OlaMarker as Marker };
  export { OlaPopup as Popup };
}

// Navigation Control
export declare class NavigationControl {
  constructor(options?: {
    showCompass?: boolean;
    showZoom?: boolean;
    visualizePitch?: boolean;
  });
}

// Geolocate Control
export declare class GeolocateControl {
  constructor(options?: {
    positionOptions?: PositionOptions;
    fitBoundsOptions?: any;
    trackUserLocation?: boolean;
    showAccuracyCircle?: boolean;
    showUserHeading?: boolean;
  });
  
  trigger(): boolean;
}