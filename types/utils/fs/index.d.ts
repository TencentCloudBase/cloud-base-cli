export declare type SizeUnit = 'KB' | 'MB' | 'GB';
export declare function checkPathExist(dest: string, throwError?: boolean): boolean;
export declare function isDirectory(dest: string): boolean;
export declare function formateFileSize(size: number | string, unit: SizeUnit): string;
export * from './del';
