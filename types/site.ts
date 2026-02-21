import { ChargePoint } from "./charge-point";

export type Site = {
  id: string;
  name: string;
  customer: string;
  installDate: Date;
  lastVisit: Date;
  chargePoints: ChargePoint[];
  pos?: {
    lat: string;
    lng: string;
  };
};
