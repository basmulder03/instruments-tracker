import {z} from "zod";

export const signInSchema = z.object({
    email: z.string().email({message: "Invalid email address"}),
    password: z.string().min(6),
});

export type SignInFormValues = z.infer<typeof signInSchema>;