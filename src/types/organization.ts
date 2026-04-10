export type OrgPlan = "free" | "pro" | "business";
export type OrgRole = "owner" | "admin" | "member" | "viewer";

export interface Organization {
    id:           number;
    name:         string;
    slug:         string;
    plan:         OrgPlan;
    intended_plan: OrgPlan;
    member_count: number;
    created_at:   string;
    // augmented by /api/auth/me/ and /api/orgs/ list
    role?:        OrgRole;
    is_current?:  boolean;
    can_approve?: boolean;
}

export interface Membership {
    id:          number;
    user:        MemberUser;
    role:        OrgRole;
    can_approve: boolean;
    invited_by:  MemberUser | null;
    joined_at:   string;
}

export interface MemberUser {
    id:         number;
    email:      string;
    first_name: string;
    last_name:  string;
    full_name:  string;
}

export interface Invitation {
    id:           number;
    email:        string;
    role:         OrgRole;
    invited_by:   MemberUser | null;
    created_at:   string;
    expires_at:   string;
    is_pending:   boolean;
}

export interface PublicInvitation {
    email:             string;
    role:              OrgRole;
    organization_name: string;
    inviter_name:      string;
    is_pending:        boolean;
    is_expired:        boolean;
}

export interface ActivityLog {
    id:           number;
    action:       string;
    user_name:    string;
    target_name:  string | null;
    invoice_name: string | null;
    metadata:     Record<string, unknown>;
    created_at:   string;
}

// Shape of membership info returned by /api/auth/me/
export interface MyMembership {
    id:          number;
    role:        OrgRole;
    can_approve: boolean;
}
