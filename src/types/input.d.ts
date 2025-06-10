declare module 'input' {
    const input: {
        text: (prompt: string) => string | Promise<string>;
        confirm: (prompt: string) => boolean | Promise<boolean>;
        select: (prompt: string, choices: string[]) => string | Promise<string>;
    };
    export = input;
} 