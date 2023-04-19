export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  accessRole: string;
  photo: string;
  createdAt: number;
  deactivatedAt?: null;
  externalDirectoryId?: null;
  externalUserId?: string;
}

export const getUserField = function (user: User, fieldName: string) {
  if (user) {
    return user[fieldName];
  } else
    return undefined;
};
