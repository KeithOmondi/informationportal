export interface IGuest {
  _id: string;
  name: string;
  email: string;
  role: "guest";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
