export type Position = {
    x: number;
    y: number;
};

export type Command = {
    name: string;
    action: () => void;
};
