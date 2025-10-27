// import { v2 } from "@googlemaps/routing";
// const { RoutesClient } = v2;

// const routingClient = new RoutesClient();

import axios from "axios";

import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

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

  const distance = httpsCallable(functions, "computeRouteDistance");

  const res = await distance(payload);

  return res.data;
};

export { getRouteDistance };
