import { MemoryItem, NoteItem, MissionItem, AchievementItem, UserProfile, GoalItem, CouponItem } from '../types';

export const initialProfiles: { sapo: UserProfile; miRey: UserProfile } = {
  sapo: {
    name: 'Elvia',
    avatar: 'https://lh3.googleusercontent.com/aida/AP1WRLutY3v06VYabEZxKTfmiqDRSrEppKQldLh7fY35h6SphIy1qfqKAT-g9T4D2kM0pwO0ZlCRLHyWm8DDKtQUywfaxR9VXrOZMAfgrARuXRkaZXSO3Q6zreBVpPj5HqKb0_WUnRn4fxhrOBZpHNIoCBP0SZWDCD3nl5ColREUs5V-OrOMpu5iZqQBdOtZle6SXEtEt90WA9JZS8Orcep4lkOMQ294C6RRxTJPaoFXzcfF2nwbjTwHeHamziM',
    city: 'Guayaquil',
    country: 'Ecuador',
    timezone: 'America/Guayaquil',
    statusPhrase: 'Esperando en el lobby... 🐸💚',
    pushAlerts: true,
    soundEffects: false,
  },
  miRey: {
    name: 'Mi Rey',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    city: 'CABA',
    country: 'Argentina',
    timezone: 'America/Argentina/Buenos_Aires',
    statusPhrase: 'Siempre juntos, a la distancia',
    pushAlerts: true,
    soundEffects: true,
  }
};

// All initial data arrays are empty — users will add their own content
export const initialMemories: MemoryItem[] = [];
export const initialNotes: NoteItem[] = [];
export const initialMissions: MissionItem[] = [];
export const initialAchievements: AchievementItem[] = [];
export const initialGoals: GoalItem[] = [];
export const initialCoupons: CouponItem[] = [];
