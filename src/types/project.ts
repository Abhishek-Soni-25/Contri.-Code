export interface Project {
  id: string;
  name: string;
  technology: string;
  technologyColor: string;
  path: string;
  lastEdited: string;
  isRemote?: boolean;
  supabaseId?: string;
  secretKey?: string;
  ownerId?: string;
}