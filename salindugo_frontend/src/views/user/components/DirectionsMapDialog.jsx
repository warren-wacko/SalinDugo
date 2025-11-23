import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Map, MapPin } from "lucide-react";
import { toast } from "sonner";

// Hospital icon (red marker)
const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/148/148836.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// User icon (blue marker)
const userIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function DirectionsMapDialog({
  hospital,
  userLocation,
  open,
  onOpenChange,
}) {
  const hospitalLat = parseFloat(hospital.latitude ?? 14.5995);
  const hospitalLng = parseFloat(hospital.longitude ?? 120.9842);
  const userLat = parseFloat(userLocation?.latitude ?? 14.5995);
  const userLng = parseFloat(userLocation?.longitude ?? 120.9842);
  const centerLat = (userLat + hospitalLat) / 2;
  const centerLng = (userLng + hospitalLng) / 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[500px]">
        <DialogHeader>
          <DialogTitle>Directions to {hospital.hospital_name}</DialogTitle>
          <DialogDescription>
            Blue marker: Your location | Red marker: Hospital
          </DialogDescription>
        </DialogHeader>

        <div className="h-96 rounded-lg overflow-hidden border">
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {/* User Marker */}
            <Marker position={[userLat, userLng]} icon={userIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Your Location</p>
                  <p className="text-xs text-muted-foreground">
                    {userLocation?.address || "Your current location"}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Hospital Marker */}
            <Marker position={[hospitalLat, hospitalLng]} icon={hospitalIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{hospital.hospital_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {hospital.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hospital.contact_number}
                  </p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              const mapsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${hospitalLat},${hospitalLng}`;
              window.open(mapsUrl, "_blank");
            }}
          >
            <Map className="h-4 w-4 mr-2" /> Open in Google Maps
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
