// import { v2 } from "@googlemaps/routing";
// const { RoutesClient } = v2;

// const routingClient = new RoutesClient();

import axios from "axios";

// TODO: Change this to a firebase function
const getRouteDistance = async ({ pharmacyLocation, customerLocation }) => {
  const { pharmLat, pharmLng } = pharmacyLocation;
  const { customerLat, customerLng, customerAddress } = customerLocation;

  const origin = {
    location: {
      latLng: {
        latitude: pharmLat,
        longitude: pharmLng,
      },
    },
  };
  const destination =
    customerAddress !== null
      ? {
          address: customerAddress,
        }
      : {
          location: {
            latLng: {
              latitude: customerLat,
              longitude: customerLng,
            },
          },
        };

  const payload = { origin, destination };
  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": "AIzaSyBrRCC7uRo9vv-VtbIq7lWP_1dEg89o77k",
    "X-Goog-FieldMask":
      "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
  };

  const response = await axios.post(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    payload,
    {
      headers: headers,
    }
  );

  return response.data.routes[0];
};

export { getRouteDistance };
