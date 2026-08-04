export interface PersistedStudySessionExercise {
  readonly exerciseId: string;
  readonly exerciseKind: "cloze";
  readonly candidateId: string;
  readonly senseId: string;
  readonly exampleId: string;
  readonly sourceSentence: string;
  readonly gapSentence: string;
  readonly answer: string;
  readonly options: readonly [string, string, string, string];
  readonly provenance: {
    readonly exampleProvider: string;
    readonly exampleSourceRecordId: string;
    readonly lexicalProvider: string;
    readonly lexicalSourceRecordId: string;
  };
}

export interface PersistedStudySessionSnapshot {
  readonly sessionId: string;
  readonly snapshotVersion: "study-session-snapshot-v1";
  readonly title: string;
  readonly level: string;
  readonly createdAt: string;
  readonly exerciseIds: readonly string[];
  readonly exercises: readonly PersistedStudySessionExercise[];
}
