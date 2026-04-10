let _orgId: number | null = null;

export const orgStore = {
    get: (): number | null => _orgId,
    set: (orgId: number | null): void => {
        _orgId = orgId;
    },
};
