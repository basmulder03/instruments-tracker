export const passwordConstraints: {
    id: number,
    name: string;
    message: string;
    regex: string;
}[] = [
    {
        id: 1,
        name: "minLength",
        message: "Password must be at least 8 characters",
        regex: ".{8,}"
    },
    {
        id: 2,
        name: "lowercase",
        message: "Password must contain at least one lowercase letter",
        regex: "(?=.*[a-z])"
    },
    {
        id: 3,
        name: "uppercase",
        message: "Password must contain at least one uppercase letter",
        regex: "(?=.*[A-Z])"
    },
    {
        id: 4,
        name: "number",
        message: "Password must contain at least one number",
        regex: "(?=.*[0-9])"
    },
    {
        id: 5,
        name: "special",
        message: "Password must contain at least one special character",
        regex: "(?=.*[!@#\\$%\\^&\\*])"
    }
]