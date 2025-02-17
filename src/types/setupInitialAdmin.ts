import {z, ZodIssueCode} from "zod";
import {passwordConstraints} from "~/validation/passwordStrength";

export const setupInitialAdminSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
})
    .superRefine(({password}, ctx) => {
        for (const constraint of passwordConstraints) {
            if (constraint.regex && !new RegExp(constraint.regex).test(password)) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    message: constraint.message,
                });
            }
        }
    })

export type SetupInitialAdminFormValues = z.infer<typeof setupInitialAdminSchema>;