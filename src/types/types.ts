export type UserRole = "guest" | "admin" | "judge";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
}

export interface IGroup {
  _id: string;
  name: string;
  description?: string;
  createdBy: string | IUser;
  members: string[] | IUser[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  _id: string;
  // 🔹 Fixed typo: 'ssender' -> 'sender'
  sender: string | { _id: string; name: string; role: string }; 
  receiver?: string | { _id: string; name: string; role: string }; 
  group?: string | IGroup; 
  text?: string;
  imageUrl?: string;
  senderType: UserRole;
  readBy: string[]; 
  isDeleted: boolean;
  createdAt: string; 
  updatedAt: string;
}