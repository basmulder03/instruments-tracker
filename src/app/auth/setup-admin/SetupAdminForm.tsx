// app/auth/setup-admin/SetupAdminForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextInput, PasswordInput, Button, Container, Paper, Title, Alert } from "@mantine/core";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {api} from "~/trpc/react";
import {type SetupInitialAdminFormValues, setupInitialAdminSchema} from "~/types/setupInitialAdmin"; // Adjust the import path as needed

export default function SetupAdminForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SetupInitialAdminFormValues>({
        resolver: zodResolver(setupInitialAdminSchema),
    });
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const { mutate } = api.setupAdmin.setupAdmin.useMutation({
        onSuccess: () => {
            router.push("/auth/signin");
        },
        onError: (err) => {
            setError(err.message);
        },
    });

    const onSubmit = (data: SetupInitialAdminFormValues) => {
        setError(null);
        mutate(data);
    };

    return (
        <Container size={420} my={40}>
            <Paper withBorder shadow="md" p={30} radius="md">
                <Title>Setup Admin Account</Title>
                {error && <Alert color="red" mt="md">{error}</Alert>}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextInput
                        label="Name"
                        placeholder="Your name"
                        {...register("name")}
                        error={errors.name?.message}
                        mt="md"
                    />
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
                    <PasswordInput
                        label="Confirm Password"
                        placeholder="Confirm your password"
                        {...register("confirmPassword")}
                        error={errors.confirmPassword?.message}
                        mt="md"
                    />
                    <Button fullWidth mt="xl" type="submit" loading={isSubmitting}>
                        Create Admin Account
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}
