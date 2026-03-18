export interface Trip {
  id: string;
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  locationName: string;
  locationLat: number;
  locationLng: number;
  coverPhotoId: string | null;
  createdAt: string;
  updatedAt: string;
}
