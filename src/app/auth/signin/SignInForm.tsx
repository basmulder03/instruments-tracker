"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    Container,
    Paper,
    Title,
    TextInput,
    PasswordInput,
    Button,
    Alert,
} from "@mantine/core";
import { signInSchema, type SignInFormValues } from "~/types/signIn";

export default function SignInForm() {
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty, isValid },
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
    });

    const onSubmit = async (data: SignInFormValues) => {
        setError(null);
        const res = await signIn("credentials", {
            redirect: false,
            email: data.email,
            password: data.password,
        });

        // If NextAuth returns an error, display it in the form.
        if (res?.error) {
            setError("Invalid email or password");
        } else if (res?.ok) {
            router.push("/");
        }
    };

    return (
        <Container size={420} my={40}>
            <Paper withBorder shadow="md" p={30} radius="md">
                <Title>Sign In</Title>
                {error && (
                    <Alert color="red" mt="md">
                        {error}
                    </Alert>
                )}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextInput
                        label="Email"
                        placeholder="you@example.com"
                        {...register("email")}
                        error={errors.email?.message}
                        mt="md"
                    />

                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        {...register("password")}
                        error={errors.password?.message}
                        mt="md"
                    />

                    <Button fullWidth mt="xl" type="submit" loading={isSubmitting} disabled={isSubmitting || !isDirty || !isValid}>
                        Sign In
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}
