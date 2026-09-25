export const ROLE_LABEL: Record<string, string> = {
    ADMIN: "Admin Full Control",
    PETUGAS: "Petugas",
    USER: "Masyarakat",
};

export const getRoleLabel = (role: string): string => {
    return ROLE_LABEL[role] ?? role;
};
