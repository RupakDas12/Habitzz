export interface Habit {
    id: string;
    name: string;
    time: Date;
    date: string;          // YYYY-MM-DD — the day this habit belongs to
    completedDates: string[]; // Array of YYYY-MM-DD strings (for toggle tracking)
    createdAt: number;
}

export type RootStackParamList = {
    '(tabs)': undefined;
    onboarding: undefined;
    modal: undefined;
};
