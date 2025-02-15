"use client";

import {useMantineColorScheme} from "@mantine/core";
import {ReactNode, useEffect} from "react";
import {TRPCReactProvider} from "~/trpc/react";

export function Providers({children}: { children: ReactNode }) {
    const {setColorScheme} = useMantineColorScheme();

    // On mount, set the color scheme based on the user's preference
    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (event: MediaQueryListEvent) => {
            setColorScheme(event.matches ? "dark" : "light");
        }

        // Set the initial color scheme
        setColorScheme(mediaQuery.matches ? "dark" : "light");

        // Listen for changes in the system preference
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [setColorScheme]);

    return (
        <TRPCReactProvider>
                {children}
        </TRPCReactProvider>
    )
}