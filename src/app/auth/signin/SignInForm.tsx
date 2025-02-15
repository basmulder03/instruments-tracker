"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Button, Container, Paper, PasswordInput, TextInput, Title} from "@mantine/core";
import {signIn} from "next-auth/react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {SignInFormValues, signInSchema} from "~/app/auth/signin/validation";

export default function SignInForm() {
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting}
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        mode: "onTouched"
    });

    const onSubmit = async (values: SignInFormValues) => {
        setError(null);
        const res = await signIn("credentials", {
            redirect: false,
            email: values.email,
            password: values.password
        });

        if (res?.ok) {
            router.push("/");
        } else {
            setError("Invalid email or password");
        }
    }

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

                    <Button fullWidth mt="xl" type="submit" loading={isSubmitting}>
                        Sign In
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}