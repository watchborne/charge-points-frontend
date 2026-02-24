export type Site = {
  id: string;
  name: string;
  customer: string;
  installDate: Date;
  lastVisit: Date;
  pos?: {
    lat: string;
    lng: string;
  };
};
