export interface EventStats {
  // The total number of marches
  numEvents: number;
  // The total number of participants for all the marches
  numParticipants: number;  
}

export interface PetitionStats {
  // The total number of petition signatures
  numPetitionSignatures: number;  
}

export interface StatsForOurLives extends EventStats, PetitionStats {}
