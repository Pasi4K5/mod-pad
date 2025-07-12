export type Position = {
    x: number;
    y: number;
};

export type CaretPosition = {
    global: number;
    line: number;
    col: number;
};

export type Command = {
    name: string;
    action: () => void;
};
