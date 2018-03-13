export interface EventStats {
    numEvents: number;
    numParticipants: number;
}
export interface PetitionStats {
    numPetitionSignatures: number;
}
export interface StatsForOurLives extends EventStats, PetitionStats {
}
